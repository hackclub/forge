require "net/http"
require "json"

module AiRequirementsChecker
  module_function

  ENDPOINT = "https://ai.hackclub.com/proxy/v1/chat/completions".freeze
  MODEL = "google/gemini-3-flash-preview".freeze
  DOC_GLOBS = [
    Rails.root.join("docs/requirements/*.md"),
    Rails.root.join("docs/design/*.md")
  ].freeze

  class Error < StandardError; end

  def run(project)
    response = post_chat(build_prompt(project))
    raise Error, "AI request failed (#{response.code})" unless response.is_a?(Net::HTTPSuccess)

    content = JSON.parse(response.body).dig("choices", 0, "message", "content").to_s
    parsed = extract_json(content) || {}

    {
      "summary" => parsed["summary"].to_s,
      "overall" => normalize_verdict(parsed["overall"]),
      "requirements" => Array(parsed["requirements"]).first(40).map { |req| sanitize_requirement(req) },
      "checked_at" => Time.current.iso8601,
      "model" => MODEL
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
      You are an experienced Hack Club Forge reviewer. Evaluate the project below against the Forge requirements and design docs, and produce a per-requirement checklist plus an overall verdict.

      ## Forge documentation (treat as the rubric)
      #{docs_text}

      ## Project under review
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

      ## Task
      For each concrete requirement you can extract from the rubric (especially `docs/requirements/*`), output one entry. Skip soft suggestions; only include checkable requirements. For each, give:
        - name: short imperative name of the requirement (under 8 words)
        - verdict: "pass", "fail", or "uncertain"
        - reasoning: one sentence pointing to specific evidence in the project (or its absence)
        - source: the doc filename it came from (e.g. "shipping.md")

      Then output an overall verdict ("pass" if all critical requirements clearly pass, "fail" if any critical one clearly fails, "uncertain" otherwise) and a 1-2 sentence summary.

      Respond in valid JSON only, no markdown fences:
      {"summary": "...", "overall": "pass|fail|uncertain", "requirements": [{"name": "...", "verdict": "pass|fail|uncertain", "reasoning": "...", "source": "..."}]}
    PROMPT
  end

  def post_chat(prompt)
    uri = URI(ENDPOINT)
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true
    http.read_timeout = 90

    req = Net::HTTP::Post.new(uri)
    req["Content-Type"] = "application/json"
    req["Authorization"] = "Bearer #{ENV['HACKCLUB_AI_API_KEY']}"
    req.body = { model: MODEL, messages: [ { role: "user", content: prompt } ] }.to_json

    http.request(req)
  end

  def extract_json(text)
    match = text.match(/\{[\s\S]*\}/)
    return nil unless match

    JSON.parse(match[0])
  rescue JSON::ParserError
    nil
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
