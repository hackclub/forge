require "net/http"
require "json"
require "digest"

module AiRequirementsChecker
  module_function

  PROVIDERS = {
    "hackclub" => {
      endpoint: "https://ai.hackclub.com/proxy/v1/chat/completions",
      model: "google/gemini-3-flash-preview",
      api_key_env: "HACKCLUB_AI_API_KEY",
      label: "Hack Club AI"
    },
    "google" => {
      endpoint: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
      model: "gemini-3-flash-preview",
      api_key_env: "GEMINI_API_KEY",
      label: "Google Gemini"
    }
  }.freeze
  DEFAULT_PROVIDER = "google".freeze
  EVALUATION_TIMEOUT = 90
  RATE_LIMIT_RETRIES = 4
  RETRYABLE_CODES = [ 429, 500, 502, 503, 504 ].freeze

  DOC_GLOBS = [
    Rails.root.join("docs/requirements/*.md"),
    Rails.root.join("docs/design/*.md")
  ].freeze

  class Error < StandardError; end

  def run(project, provider: ENV.fetch("AI_REQUIREMENTS_PROVIDER", DEFAULT_PROVIDER))
    base = PROVIDERS[provider.to_s] || raise(Error, "Unknown AI provider: #{provider}")
    raise Error, "#{base[:label]} API key is not configured" if ENV[base[:api_key_env]].to_s.empty?

    config = base.merge(model: ENV.fetch("AI_REQUIREMENTS_MODEL", base[:model]))

    requirements = list_requirements(config)
    raise Error, "Could not extract any requirements from the rubric." if requirements.empty?

    requirements = requirements_for_tier(requirements, project.tier)
    evaluated = evaluate_all(requirements, project, config)

    {
      "summary" => build_summary(evaluated),
      "overall" => overall_verdict(evaluated),
      "requirements" => evaluated,
      "checked_at" => Time.current.iso8601,
      "model" => config[:model],
      "provider" => provider.to_s
    }
  end

  # Keep tiers an explicit subset of a requirement only when the docs gate it
  # (e.g. pitches are Tier 1 only). An empty array means "applies to every tier".
  def requirements_for_tier(requirements, tier)
    tier_number = tier.to_s[/\d+/]&.to_i
    requirements.select do |req|
      tiers = Array(req["tiers"])
      tiers.empty? || tier_number.nil? || tiers.include?(tier_number)
    end
  end

  def list_requirements(config)
    Rails.cache.fetch([ "ai_requirements_checker", "requirement_list", "v2", docs_digest, config[:model] ], expires_in: 12.hours) do
      fetch_requirement_list(config)
    end
  end

  def fetch_requirement_list(config)
    response = post_chat(list_requirements_prompt, config)
    raise_for_response!(response, config)

    content = JSON.parse(response.body).dig("choices", 0, "message", "content").to_s
    parsed = extract_json(content) || {}
    Array(parsed["requirements"]).first(20).filter_map do |req|
      next unless req.is_a?(Hash)
      name = req["name"].to_s.strip
      next if name.empty?

      {
        "name" => name.truncate(120),
        "source" => req["source"].to_s.truncate(80),
        "criterion" => req["criterion"].to_s.truncate(400),
        "tiers" => Array(req["tiers"]).filter_map { |t| Integer(t, exception: false) }
      }
    end
  end

  def evaluate_all(requirements, project, config)
    project_context = project_context_text(project)
    response = post_chat(evaluate_all_prompt(requirements, project_context), config)
    return requirements.map { |req| uncertain_result(req, "Couldn't reach the AI (#{response&.code}).") } unless response.is_a?(Net::HTTPSuccess)

    content = JSON.parse(response.body).dig("choices", 0, "message", "content").to_s
    parsed = extract_json(content) || {}
    by_name = Array(parsed["results"]).each_with_object({}) do |row, acc|
      next unless row.is_a?(Hash)

      key = row["name"].to_s.strip.downcase
      acc[key] = row unless key.empty?
    end

    requirements.map do |req|
      row = by_name[req["name"].to_s.strip.downcase]
      next uncertain_result(req, "The AI didn't return a verdict for this one — please verify yourself.") unless row

      {
        "name" => req["name"],
        "source" => req["source"],
        "verdict" => normalize_verdict(row["verdict"]),
        "reasoning" => row["reasoning"].to_s.truncate(400)
      }
    end
  rescue Net::ReadTimeout, Net::OpenTimeout
    requirements.map { |req| uncertain_result(req, "Check timed out — please verify yourself.") }
  rescue SocketError, Errno::ECONNREFUSED, Errno::ECONNRESET, OpenSSL::SSL::SSLError, JSON::ParserError
    requirements.map { |req| uncertain_result(req, "Couldn't get a clean answer from the AI — please verify yourself.") }
  end

  def uncertain_result(requirement, message)
    {
      "name" => requirement["name"],
      "source" => requirement["source"],
      "verdict" => "uncertain",
      "reasoning" => message
    }
  end

  def overall_verdict(evaluated)
    verdicts = evaluated.map { |r| r["verdict"] }
    return "fail" if verdicts.include?("fail")
    return "uncertain" if verdicts.include?("uncertain")
    "pass"
  end

  def build_summary(evaluated)
    fails = evaluated.select { |r| r["verdict"] == "fail" }
    uncertains = evaluated.select { |r| r["verdict"] == "uncertain" }
    passes = evaluated.count { |r| r["verdict"] == "pass" }

    if fails.any?
      top = fails.first(3).map { |r| r["name"] }.join(", ")
      "#{fails.size} thing#{'s' if fails.size != 1} to fix before you submit — start with: #{top}."
    elsif uncertains.any?
      "Looks promising — #{passes} clear pass#{'es' if passes != 1}, but #{uncertains.size} item#{'s' if uncertains.size != 1} I couldn't verify from text alone. Give them a once-over yourself."
    else
      "Looks great! All #{passes} checks passed."
    end
  end

  def docs_text
    @docs_text ||= Dir[*DOC_GLOBS].sort.map do |path|
      "### #{Pathname.new(path).relative_path_from(Rails.root)}\n\n#{File.read(path)}"
    end.join("\n\n---\n\n")
  end

  def docs_digest
    @docs_digest ||= Digest::SHA256.hexdigest(docs_text)
  end

  def list_requirements_prompt
    <<~PROMPT
      You're helping prepare a checklist for Hack Club Forge project submissions. From the docs below, extract every concrete, checkable requirement a builder needs to meet before submitting. Aim for 8-18 entries. Each entry should be one distinct thing — do not collapse multiple requirements into a single item. Skip purely soft suggestions ("try to" / "consider…").

      ## Forge docs
      #{docs_text}

      ## Output
      For each requirement, give:
        - name: short neutral name, under 8 words
        - source: the doc filename it came from (e.g. "submitting.md")
        - criterion: one sentence describing exactly what the project must have or do to pass this requirement
        - tiers: project tiers this requirement applies to, as numbers 1-4. Use an empty array [] when it applies to every tier. ONLY list specific tiers when the docs explicitly gate it (e.g. "you are only required to pitch for Tier 1 projects" → [1]). Note tier 1 is the most advanced, tier 4 the simplest.

      Respond in valid JSON only, no markdown fences:
      {"requirements": [{"name": "...", "source": "...", "criterion": "...", "tiers": []}]}
    PROMPT
  end

  def project_context_text(project)
    devlog_summary = project.devlogs.order(created_at: :asc).map do |d|
      "- #{d.created_at.to_date} · #{d.title} — #{d.parsed_hours.to_f.round(2)}h logged: #{d.content.to_s.truncate(400)}"
    end.join("\n").presence || "(no devlogs)"

    <<~CTX
      - Name: #{project.name}
      - Subtitle: #{project.subtitle}
      - Tier: #{project.tier}
      - Devlog mode: #{project.devlog_mode.presence || 'unknown'}
      - Repo: #{project.repo_link.presence || '(none)'}
      - Total devlog hours: #{project.devlog_hours}
      - Cover image: #{project.cover_image_url.present? ? 'yes' : 'no'}

      ### Pitch
      #{project.pitch_text.to_s.truncate(2000).presence || '(no pitch text)'}

      ### Admin description
      #{project.description.to_s.truncate(1000).presence || '(no description)'}

      ### README (cached)
      #{project.readme_cache.to_s.truncate(4000).presence || '(no README cached)'}

      ### Devlogs
      #{devlog_summary}
    CTX
  end

  def evaluate_all_prompt(requirements, project_context)
    requirement_list = requirements.each_with_index.map do |req, i|
      "#{i + 1}. name: #{req['name']}\n   source: #{req['source']}\n   what it means: #{req['criterion']}"
    end.join("\n")

    <<~PROMPT
      You're Orph, a friendly Hack Club Forge helper doing a pre-submission check. Be encouraging and constructive — your job is to help the builder ship, not gatekeep. Evaluate the project against EVERY requirement below and give a verdict for each one.

      ## The requirements
      #{requirement_list}

      ## The project
      #{project_context}

      ## What you can verify
      You only see text — project metadata and README markdown. You DO NOT see images, screenshots, or rendered pages.
        - You CAN check: text content (descriptions, BOM tables, sections, headings), markdown image references (`![alt](url)` or `<img>`), repo URL format, devlog text, hour totals, journal format strings.
        - You CANNOT check: what an image actually depicts (PCB vs. random photo), code quality, whether the build looks real.

      For visual requirements: if the README has at least one image reference, mark "uncertain" and say you can see images but can't verify their content. If there are zero image references, mark "fail" and say no images were found.

      Devlog hours and format: each devlog above shows the hours the builder logged ("Xh logged"). Treat that as the builder's stated time spent. A "website" devlog states its time in that structured field, NOT as a journal sentence — so for website mode, count logged hours as satisfying any "time spent / duration stated" requirement, and do not fail it for missing a "Total time spent: X hours" phrase. Journal-format requirements (YAML frontmatter, dated entry headers, the "Total time spent" phrasing) only apply to "git" journal mode; for "website" mode, mark those "pass".

      ## Output
      Return a verdict for every requirement, echoing back its exact `name`. Respond in valid JSON only, no markdown fences:
      {"results": [{"name": "...", "verdict": "pass|fail|uncertain", "reasoning": "one short sentence, on the builder's side"}]}
    PROMPT
  end

  def raise_for_response!(response, config)
    return if response.is_a?(Net::HTTPSuccess)
    detail = extract_upstream_error(response.body).to_s.truncate(200)
    raise Error, "#{config[:label]} request failed (#{response.code})#{detail.present? ? ": #{detail}" : ''}"
  end

  def post_chat(prompt, config)
    uri = URI(config[:endpoint])
    body = { model: config[:model], messages: [ { role: "user", content: prompt } ] }.to_json

    attempt = 0
    response = nil
    loop do
      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = true
      http.open_timeout = 10
      http.read_timeout = EVALUATION_TIMEOUT

      req = Net::HTTP::Post.new(uri)
      req["Content-Type"] = "application/json"
      req["Authorization"] = "Bearer #{ENV[config[:api_key_env]]}"
      req.body = body
      response = http.request(req)

      break unless RETRYABLE_CODES.include?(response.code.to_i) && attempt < RATE_LIMIT_RETRIES

      retry_after = response["Retry-After"].to_f
      delay = retry_after.positive? ? retry_after : (2**attempt) + rand
      sleep [ delay, 10 ].min
      attempt += 1
    end

    response
  end

  def extract_json(text)
    match = text.match(/\{[\s\S]*\}/)
    return nil unless match

    JSON.parse(match[0])
  rescue JSON::ParserError
    nil
  end

  def extract_upstream_error(body)
    parsed = JSON.parse(body.to_s)
    parsed.dig("error", "message") || parsed["error"] || parsed["message"] || body.to_s
  rescue JSON::ParserError
    body.to_s
  end

  def normalize_verdict(value)
    v = value.to_s.downcase
    %w[pass fail uncertain].include?(v) ? v : "uncertain"
  end
end
