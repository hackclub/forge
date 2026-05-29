require "net/http"
require "json"

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
  DEFAULT_PROVIDER = "hackclub".freeze

  DOC_GLOBS = [
    Rails.root.join("docs/requirements/*.md"),
    Rails.root.join("docs/design/*.md")
  ].freeze

  class Error < StandardError; end

  def run(project, provider: ENV.fetch("AI_REQUIREMENTS_PROVIDER", DEFAULT_PROVIDER))
    base = PROVIDERS[provider.to_s] || raise(Error, "Unknown AI provider: #{provider}")
    raise Error, "#{base[:label]} API key is not configured" if ENV[base[:api_key_env]].to_s.empty?

    config = base.merge(model: ENV.fetch("AI_REQUIREMENTS_MODEL", base[:model]))

    response = post_chat(build_prompt(project), config)
    unless response.is_a?(Net::HTTPSuccess)
      detail = extract_upstream_error(response.body).to_s.truncate(200)
      raise Error, "#{config[:label]} request failed (#{response.code})#{detail.present? ? ": #{detail}" : ''}"
    end

    content = JSON.parse(response.body).dig("choices", 0, "message", "content").to_s
    parsed = extract_json(content) || {}

    {
      "summary" => parsed["summary"].to_s,
      "overall" => normalize_verdict(parsed["overall"]),
      "requirements" => Array(parsed["requirements"]).first(40).map { |req| sanitize_requirement(req) },
      "checked_at" => Time.current.iso8601,
      "model" => config[:model],
      "provider" => provider.to_s
    }
  end

  def docs_text
    @docs_text ||= Dir[*DOC_GLOBS].sort.map do |path|
      "### #{Pathname.new(path).relative_path_from(Rails.root)}\n\n#{File.read(path)}"
    end.join("\n\n---\n\n")
  end

  def build_prompt(project)
    devlog_summary = project.devlogs.order(created_at: :asc).map do |d|
      "- #{d.created_at.to_date} · #{d.title} (#{d.time_spent || '—'}): #{d.content.to_s.truncate(400)}"
    end.join("\n").presence || "(no devlogs)"

    <<~PROMPT
      You're Orph, a friendly Hack Club Forge helper. The builder hasn't submitted yet — you're giving them a heads-up so they can fix anything obvious before a human reviewer sees it. Be warm and encouraging, like a teammate doing a quick pre-flight check, not a strict grader. The goal is to *help them ship*, not to gatekeep.

      ## Forge documentation (the requirements you're checking against)
      #{docs_text}

      ## Project to check
      - Name: #{project.name}
      - Subtitle: #{project.subtitle}
      - Tier: #{project.tier}
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

      ## What you can and cannot verify
      You only see *text* — the project metadata above and the README markdown. You DO NOT see images, screenshots, or rendered pages. That means:
        - You CAN check: presence of text content (descriptions, BOM tables, sections, headings), presence of markdown image links (`![alt](url)` or `<img>` tags), repository URL format, devlog text content, hour totals, journal format strings like `Total time spent:`.
        - You CANNOT check: whether an image actually depicts a PCB / schematic / 3D render / hardware photo, whether the README's images are high quality, whether code in the repo works, whether the build looks "real," or anything visual.

      For requirements that depend on visual content you cannot see:
        - If the README contains at least one image reference (`![...](...)` or `<img …>`), mark "uncertain" and say something like "I can see images in the README but can't verify they show the required content — double-check yourself."
        - If the README has *no* image references at all, mark "fail" and say no images were found in the README.
        - Never claim a screenshot exists or doesn't exist based on guessing — only the literal image markdown counts.

      ## Task
      Extract every concrete, checkable requirement from the rubric (especially `docs/requirements/*` and `docs/design/journal-format.md` / `how-to-journal.md`). Aim for thorough coverage — 8 to 20 entries is normal. Do NOT collapse multiple distinct requirements into one entry. Only skip purely soft suggestions ("try to" / "consider…"). For visual requirements you can't fully verify, still include them and mark "uncertain" — never drop them.

      For each requirement:
        - name: short, neutral name of the requirement (under 8 words)
        - verdict: "pass", "fail", or "uncertain". Prefer "uncertain" over guessing on anything visual.
        - reasoning: one short sentence. Quote or point at the specific evidence (or its absence) — e.g. "no `BOM.csv` mentioned in the README" or "README has 2 image references but I can't tell what they show — please verify." If passing, say so briefly. Always sound like you're on the builder's side.
        - source: the doc filename it came from (e.g. "shipping.md")

      Then an overall verdict — "pass" if everything important clearly passes, "fail" only if something important is clearly missing in the text, "uncertain" if visual-only items remain — and a 1-2 sentence summary that names the biggest thing to fix (if any) without piling on. If the project looks great, just say it looks great.

      Respond in valid JSON only, no markdown fences:
      {"summary": "...", "overall": "pass|fail|uncertain", "requirements": [{"name": "...", "verdict": "pass|fail|uncertain", "reasoning": "...", "source": "..."}]}
    PROMPT
  end

  def post_chat(prompt, config)
    uri = URI(config[:endpoint])
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true
    http.read_timeout = 90

    req = Net::HTTP::Post.new(uri)
    req["Content-Type"] = "application/json"
    req["Authorization"] = "Bearer #{ENV[config[:api_key_env]]}"
    req.body = { model: config[:model], messages: [ { role: "user", content: prompt } ] }.to_json

    http.request(req)
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

  def sanitize_requirement(req)
    req = req.is_a?(Hash) ? req : {}
    {
      "name" => req["name"].to_s.truncate(120),
      "verdict" => normalize_verdict(req["verdict"]),
      "reasoning" => req["reasoning"].to_s.truncate(400),
      "source" => req["source"].to_s.truncate(80)
    }
  end
end
