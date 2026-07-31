require "json"
require "digest"

module AiRequirementsChecker
  module_function

  DEFAULT_MODEL = "claude-opus-4-8".freeze
  EVALUATION_TIMEOUT = 120
  MAX_RETRIES = 4

  DOC_GLOBS = [
    Rails.root.join("docs/requirements/*.md"),
    Rails.root.join("docs/design/*.md")
  ].freeze

  class Error < StandardError; end

  VERDICT_SCHEMA = { type: "string", enum: %w[pass fail uncertain] }.freeze

  REQUIREMENT_LIST_SCHEMA = {
    type: "object",
    properties: {
      requirements: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            source: { type: "string" },
            criterion: { type: "string" },
            tiers: { type: "array", items: { type: "integer" } }
          },
          required: %w[name source criterion tiers],
          additionalProperties: false
        }
      }
    },
    required: %w[requirements],
    additionalProperties: false
  }.freeze

  EVALUATION_SCHEMA = {
    type: "object",
    properties: {
      results: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            verdict: VERDICT_SCHEMA,
            reasoning: { type: "string" }
          },
          required: %w[name verdict reasoning],
          additionalProperties: false
        }
      }
    },
    required: %w[results],
    additionalProperties: false
  }.freeze

  JUSTIFICATION_SCHEMA = {
    type: "object",
    properties: {
      summary: { type: "string" },
      checks: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            verdict: VERDICT_SCHEMA,
            reasoning: { type: "string" }
          },
          required: %w[name verdict reasoning],
          additionalProperties: false
        }
      }
    },
    required: %w[summary checks],
    additionalProperties: false
  }.freeze

  def run(project)
    ensure_configured!

    requirements = list_requirements
    raise Error, "Could not extract any requirements from the rubric." if requirements.empty?

    requirements = requirements_for_tier(requirements, project.tier)
    evaluated = evaluate_all(requirements, project)

    {
      "summary" => build_summary(evaluated),
      "overall" => overall_verdict(evaluated),
      "requirements" => evaluated,
      "checked_at" => Time.current.iso8601,
      "model" => model,
      "provider" => "anthropic"
    }
  end

  def check_justification(item)
    ensure_configured!

    parsed = complete_json(justification_prompt(item), schema: JUSTIFICATION_SCHEMA)
    checks = Array(parsed["checks"]).filter_map do |row|
      next unless row.is_a?(Hash)
      name = row["name"].to_s.strip
      next if name.empty?

      {
        "name" => name.truncate(120),
        "verdict" => normalize_verdict(row["verdict"]),
        "reasoning" => row["reasoning"].to_s.truncate(400)
      }
    end

    {
      "overall" => overall_verdict(checks),
      "summary" => parsed["summary"].to_s.truncate(400).presence || build_summary(checks),
      "checks" => checks,
      "checked_at" => Time.current.iso8601,
      "model" => model,
      "provider" => "anthropic"
    }
  end

  def justification_prompt(item)
    payload = item.payload || {}
    justification = payload["Optional - Override Hours Spent Justification"].to_s
    hours = payload["Optional - Override Hours Spent"]
    project = item.project
    kind = project&.build_review? ? "build review" : "design review"

    <<~PROMPT
      You are auditing a Hack Club Forge "Override Hours Spent Justification" before it enters the YSWS Unified Database. This text is an INTERNAL reviewer record. Judge ONLY the justification text against the standard below — do not re-review the project itself.

      ## The standard — a compliant justification must
      1. Specific and verifiable — cite concrete numbers and links another reviewer could independently check.
      2. Time evidence stated — what the journal/devlog entries and GitHub commit history (and timelapse, if provided) show, including the period covered. Forge time is journal-tracked, not Hackatime.
      3. Hour adjustment documented — if approved hours are lower than claimed, it states the claimed hours, the approved hours, and the reason for the deflation.
      4. Scope justified — explains what was built and why the scope is consistent with the approved hours.
      5. Factual internal record — NOT encouragement, praise, or a message addressed to the submitter.
      6. Independently reproducible — an uninvolved reviewer could follow the links/data and reach the same conclusion.

      ## Project facts
      - Project type: #{kind}
      - Override (approved) hours in payload: #{hours.nil? ? '(none)' : hours}
      - Repo: #{project&.repo_link.presence || '(none)'}

      ## Forge requirements docs (context)
      #{requirements_docs_text}

      ## The justification text being audited
      #{justification.strip.presence || '(empty)'}

      ## Output
      Give a verdict for each of the 6 standards above, echoing a short name for each. The summary should be one or two sentences on whether this justification is safe to submit to the Unified DB; each reasoning should be one short sentence.
    PROMPT
  end

  def requirements_docs_text
    @requirements_docs_text ||= Dir[Rails.root.join("docs/requirements/*.md")].sort.map do |path|
      "### #{Pathname.new(path).relative_path_from(Rails.root)}\n\n#{File.read(path)}"
    end.join("\n\n---\n\n")
  end

  def requirements_for_tier(requirements, tier)
    tier_number = tier.to_s[/\d+/]&.to_i
    requirements.select do |req|
      tiers = Array(req["tiers"])
      tiers.empty? || tier_number.nil? || tiers.include?(tier_number)
    end
  end

  def list_requirements
    Rails.cache.fetch([ "ai_requirements_checker", "requirement_list", "v3", docs_digest, model ], expires_in: 12.hours) do
      fetch_requirement_list
    end
  end

  def fetch_requirement_list
    parsed = complete_json(list_requirements_prompt, schema: REQUIREMENT_LIST_SCHEMA)
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

  def evaluate_all(requirements, project)
    project_context = project_context_text(project)
    parsed = complete_json(evaluate_all_prompt(requirements, project_context), schema: EVALUATION_SCHEMA)

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
  rescue Error => e
    Rails.logger.error("[AiRequirementsChecker] evaluate_all degraded: #{e.message}")
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
      Return a verdict for every requirement, echoing back its exact `name`. Keep each reasoning to one short sentence, on the builder's side.
    PROMPT
  end

  def complete_json(prompt, schema:)
    ensure_configured!

    response = client.messages.create(
      model: model,
      max_tokens: 16_000,
      thinking: { type: :adaptive },
      output_config: { format_: { type: :json_schema, schema: schema } },
      messages: [ { role: "user", content: prompt } ],
      request_options: request_options
    )

    if response.stop_reason == :refusal
      raise Error, "Claude declined this request — please verify yourself."
    end
    if response.stop_reason == :max_tokens
      raise Error, "Claude's response was cut off before it finished — run the check again."
    end

    text = response.content.filter_map { |block| block.text if block.type == :text }.join
    JSON.parse(text)
  rescue Anthropic::Errors::RateLimitError
    raise Error, "The Claude API is rate limited right now — try again in a minute."
  rescue Anthropic::Errors::APIStatusError => e
    raise Error, "Claude API request failed (#{e.status}): #{e.message.to_s.truncate(200)}"
  rescue Anthropic::Errors::APIConnectionError => e
    raise Error, "Couldn't reach the Claude API: #{e.message.to_s.truncate(200)}"
  rescue JSON::ParserError
    raise Error, "Claude returned a response that couldn't be parsed — run the check again."
  end

  def ensure_configured!
    return if ENV["ANTHROPIC_API_KEY"].present? || ENV["ANTHROPIC_AUTH_TOKEN"].present?
    raise Error, "Claude API credentials are not configured (set ANTHROPIC_API_KEY or ANTHROPIC_AUTH_TOKEN)."
  end

  def request_options
    return {} if ENV["ANTHROPIC_API_KEY"].present?
    { extra_headers: { "anthropic-beta" => "oauth-2025-04-20" } }
  end

  def model
    ENV.fetch("AI_REQUIREMENTS_MODEL", DEFAULT_MODEL)
  end

  def client
    @client ||= Anthropic::Client.new(
      max_retries: MAX_RETRIES,
      timeout: EVALUATION_TIMEOUT
    )
  end

  def normalize_verdict(value)
    v = value.to_s.downcase
    %w[pass fail uncertain].include?(v) ? v : "uncertain"
  end
end
