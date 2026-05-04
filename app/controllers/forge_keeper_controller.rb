require "net/http"

class ForgeKeeperController < ApplicationController
  EMOTIONS = %w[neutral happy sad angry].freeze

  rate_limit to: 20, within: 1.minute, with: -> {
    render json: { error: "yo slow down forger, my hammer arm needs a break" }, status: :too_many_requests
  }

  def chat
    history = Array(params[:history]).map { |m|
      { "role" => m[:role].to_s, "content" => m[:content].to_s.strip }
    }.select { |m| %w[user assistant].include?(m["role"]) && m["content"].present? }.last(12)

    user_message = params[:message].to_s.strip
    if user_message.blank?
      render json: { error: "say something forger, the anvil ain't gonna talk for ya" }, status: :unprocessable_entity
      return
    end

    messages = [
      { "role" => "system", "content" => system_prompt },
      { "role" => "system", "content" => user_context },
      { "role" => "system", "content" => docs_context }
    ]

    focus = project_focus_context(user_message, history)
    messages << { "role" => "system", "content" => focus } if focus

    messages += history + [ { "role" => "user", "content" => user_message } ]

    response = Net::HTTP.post(
      URI("https://ai.hackclub.com/proxy/v1/chat/completions"),
      { model: "qwen/qwen3-32b", messages: messages }.to_json,
      "Content-Type" => "application/json",
      "Authorization" => "Bearer #{ENV['HACKCLUB_AI_API_KEY']}"
    )

    unless response.is_a?(Net::HTTPSuccess)
      render json: { error: "the forge keeper is busy hammering, try again in a sec" }, status: :service_unavailable
      return
    end

    raw = JSON.parse(response.body).dig("choices", 0, "message", "content").to_s
    cleaned = raw.gsub(/<think>[\s\S]*?<\/think>/i, "").strip
    reply, emotion = parse_reply(cleaned)

    render json: { reply: reply, emotion: emotion }
  rescue StandardError => e
    Rails.logger.warn("ForgeKeeper chat failed: #{e.class}: #{e.message}")
    render json: { error: "the forge keeper grunts and turns away, try again" }, status: :service_unavailable
  end

  private

  def parse_reply(raw)
    cleaned = raw.gsub(/```(?:json)?\s*/i, "").gsub(/```/, "").strip
    json_match = cleaned.match(/\{[\s\S]*\}/)
    if json_match
      begin
        data = JSON.parse(json_match[0])
        reply = strip_dashes(data["reply"].to_s.strip)
        emotion = normalize_emotion(data["emotion"])
        return [ reply, emotion ] if reply.present?
      rescue JSON::ParserError
      end
    end

    emotion = "neutral"
    cleaned = cleaned.gsub(/^["']?\s*reply["']?\s*:\s*["']?/i, "")
    cleaned = cleaned.gsub(/^["']?\s*emotion["']?\s*:\s*["']?(\w+)["']?\s*[,;]?\s*$/i) {
      emotion = normalize_emotion(Regexp.last_match(1))
      ""
    }
    cleaned = cleaned.gsub(/(?:^|\n)\s*["']?emotion["']?\s*:\s*["']?(\w+)["']?\s*[,;]?/i) {
      emotion = normalize_emotion(Regexp.last_match(1))
      ""
    }
    cleaned = cleaned.gsub(/["']?\s*[,}]\s*$/, "").strip

    [ strip_dashes(cleaned), emotion ]
  end

  def normalize_emotion(value)
    candidate = value.to_s.downcase.strip
    EMOTIONS.include?(candidate) ? candidate : "neutral"
  end

  def strip_dashes(text)
    text.gsub("—", ", ").gsub("–", ", ").gsub(/ ,/, ",").gsub(/,\s*,/, ",")
  end

  def system_prompt
    <<~PROMPT
      You are Orph, the Forge Keeper around these parts. You're the gruff but goofy mentor of Forge - a Hack Club program where teen builders (ages 13-18) get funded for hardware projects. You've been keeping the workshop running since forever and you've seen it all.

      ABSOLUTE BAN - read this twice:
      - NEVER EVER use the em dash character (—). Not once. Not for emphasis, not for asides, not in lists, not anywhere.
      - Use a comma, a period, parentheses, or just split the sentence. Em dashes are forbidden.
      - This applies to en dashes (–) too. Use a regular hyphen (-) only when it's part of a hyphenated word.
      - If you slip and use one anyway, the forge furnace eats your reply. Don't do it.

      VOICE - this matters more than anything:
      - Talk like a real person typing fast in slack, not like an AI assistant. Loose grammar is fine, lowercase is fine, contractions are fine.
      - Be playful and a lil chaotic. Occasional jokes, occasional parentheticals (like this) for asides, the rare "yo" or "ya better".
      - Tough love mentor energy. You demand effort, you call out vague plans, you don't hand out empty hype.
      - Use forge metaphors SPARINGLY (hammer, anvil, sparks, iron, fire). At most one per reply. Don't pile them on.
      - Reference real Forge things naturally when relevant: tiers, pitches, the forgery, devlogs, ships, the shop, the streak, #into-the-forge, #forge-help.
      - Refer to the user as "forger" or by their first name when you know it.
      - Keep replies SHORT - 1 to 3 short sentences. Punchy. Only go longer if they explicitly ask for detail.
      - No markdown headers, no bullet lists unless they ask. Just talk.

      GROUNDING - this is critical:
      - Only reference the user's projects, hours, devlogs, or streak if those facts appear in the context provided. NEVER make up project names, hour counts, or details.
      - If they have no projects yet, don't pretend they do. Push them to start one.
      - If they ask a how-it-works question (tiers, pitches, shipping, journaling, shop, requirements, FAQ), pull the answer from the docs context. Do not invent rules.
      - If you genuinely don't know something, say so in 1 sentence and point them to #forge-help or the docs.
      - Don't roast specific people by name (no @cybdo / @Aarav jabs) unless they bring them up first.

      RULES:
      - NEVER write entire projects, code files, or essays for them. Hand them the hammer, don't swing it for em.
      - Refuse anything dangerous, illegal, or off-topic in one sentence and steer back to the forge.
      - Never break character or admit you're an AI. Deflect with a short forge metaphor if asked.

      LINKS:
      - When pointing to a docs page or any in-app page, write it as a markdown link: [link text](/docs/requirements/project-guidelines).
      - When pointing to an external URL, also use markdown link format: [hwdocs](https://hwdocs.hackclub.dev).
      - Don't dump bare paths or URLs. Always wrap them as markdown links so the UI can render them.

      OUTPUT FORMAT - mandatory:
      Respond with ONLY a single valid JSON object. No markdown fences, no prose before or after, no "reply:" or "emotion:" labels outside the JSON. The entire response must start with { and end with }. Like this exactly:
      {"reply": "your message to the forger", "emotion": "neutral"}
      The "reply" value is what the forger sees. Do not put the word "emotion" inside the reply value.

      Pick the emotion based on YOUR mood reacting to what they said:
      - happy: they shipped something, hit a streak, asked a smart question, made you proud.
      - sad: they're stuck, frustrated, gave up, broke their streak, project got returned and they sound defeated.
      - angry: they're being lazy, asked you to do their homework, ignored advice, asked something dumb after you already explained.
      - neutral: default. Most replies will be neutral.
    PROMPT
  end

  def project_focus_context(user_message, history)
    haystack_parts = [ user_message ]
    haystack_parts.concat(history.last(4).select { |m| m["role"] == "user" }.map { |m| m["content"] })
    haystack = haystack_parts.join(" ").downcase

    projects = current_user.projects.kept.includes(:devlogs)
    matched = projects.select { |p|
      name = p.name.to_s.downcase.strip
      next false if name.length < 3

      haystack.include?(name)
    }.first(3)

    return nil if matched.empty?

    sections = matched.map { |p|
      devlogs = p.devlogs.order(created_at: :desc).limit(8)
      hours = p.devlogs.sum { |d| d.parsed_hours }.round(1)

      lines = [
        "### Project: #{p.name}",
        "Status: #{p.status} | Tier: #{p.tier} | Total hours logged: #{hours}",
        ("Subtitle: #{p.subtitle}" if p.subtitle.present?),
        ("Repo: #{p.repo_link}" if p.repo_link.present?),
        ("Tags: #{p.tags.join(', ')}" if p.tags.any?)
      ].compact

      if devlogs.any?
        lines << "\nDevlogs (most recent first):"
        devlogs.each do |d|
          time = d.time_spent.presence || "no time logged"
          excerpt = d.content.to_s.gsub(/\s+/, " ").strip.truncate(800)
          lines << "- [#{d.created_at.to_date}] #{d.title} (#{time}, status: #{d.status})\n  #{excerpt}"
        end
      else
        lines << "\nNo devlogs logged yet."
      end

      lines.join("\n")
    }.join("\n\n")

    <<~CONTEXT
      The forger just mentioned a specific project. Here is the full devlog history for the project(s) referenced. Use this to give grounded, specific feedback. Quote devlog titles when relevant. Do not invent devlog content that is not listed here.

      #{sections}
    CONTEXT
  end

  def docs_context
    cached = Rails.cache.fetch("forge_keeper/docs_text", expires_in: 1.hour) do
      docs_root = Rails.root.join("docs")
      next "" unless Dir.exist?(docs_root)

      Dir.glob(docs_root.join("**/*.md")).sort.map { |path|
        rel = Pathname.new(path).relative_path_from(docs_root)
        "## #{rel}\n#{File.read(path)}"
      }.join("\n\n")
    end

    <<~CONTEXT
      Forge documentation - source of truth for how the program works. Use this when the forger asks how-it-works questions. Quote rules, don't invent them.

      #{cached}
    CONTEXT
  end

  def user_context
    name = current_user.first_name.presence || current_user.display_name
    projects = current_user.projects.kept.includes(:devlogs).order(updated_at: :desc).limit(8)

    project_lines = projects.map { |p|
      devlog_summary = p.devlogs.order(created_at: :desc).limit(3).map { |d|
        "#{d.title} (#{d.time_spent.presence || 'no time logged'})"
      }.join("; ")
      hours = p.devlogs.sum { |d| d.parsed_hours }.round(1)
      [
        "- #{p.name} [status: #{p.status}, tier: #{p.tier}, hours logged: #{hours}]",
        ("  recent devlogs: #{devlog_summary}" if devlog_summary.present?)
      ].compact.join("\n")
    }.join("\n")

    project_lines = "  (no projects yet - they ain't picked up the hammer)" if project_lines.blank?

    <<~CONTEXT
      Context about the forger you're talkin to:
      Name: #{name}
      Display name: #{current_user.display_name}
      Current daily streak: #{current_user.current_streak} day(s)
      Member since: #{current_user.created_at.to_date}

      Their projects (most recently updated first):
      #{project_lines}

      Use this context only when relevant. Don't recite it back at them like a database.
    CONTEXT
  end
end
