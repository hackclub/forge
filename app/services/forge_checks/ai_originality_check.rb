module ForgeChecks
  class AiOriginalityCheck < Base
    def self.label = "Originality of work"
    def self.source = "project-guidelines.md"
    def self.needs_ai? = true

    def call
      return skipped("No README to analyse.") unless ctx.readme_present?

      prompt = <<~PROMPT
        You're checking a Hack Club Forge submission for obvious signs of low effort or copy-pasted work. Be charitable — most builders are putting in real effort. Only flag if there are clear red flags like nonsense placeholder text, mismatched project descriptions, or text that's clearly the README of a different project. Otherwise pass.

        ## Project metadata
        - Name: #{ctx.project.name}
        - Subtitle: #{ctx.project.subtitle}

        ## README (first 3000 chars)
        #{ctx.readme.truncate(3000)}

        ## Devlogs (titles + first 300 chars each, max 5)
        #{ctx.devlogs.first(5).map { |d| "- #{d.title}: #{d.content.to_s.truncate(300)}" }.join("\n")}

        Respond in valid JSON, no markdown fences:
        {"verdict": "pass|uncertain|fail", "reasoning": "one short sentence"}
      PROMPT

      response = AiRequirementsChecker.send(:post_chat, prompt, ai_config)
      return uncertain("AI originality check unavailable (#{response.code}) — please verify yourself.") unless response.is_a?(Net::HTTPSuccess)

      content = JSON.parse(response.body).dig("choices", 0, "message", "content").to_s
      parsed = content.match(/\{[\s\S]*\}/) ? JSON.parse(content.match(/\{[\s\S]*\}/)[0]) : {}
      verdict = %w[pass fail uncertain].include?(parsed["verdict"].to_s) ? parsed["verdict"].to_s : "uncertain"
      reasoning = parsed["reasoning"].to_s.truncate(400)

      result(verdict, reasoning.presence || "Reviewed README and devlogs for originality.")
    rescue StandardError
      uncertain("AI originality check failed — please verify yourself.")
    end

    private

    def ai_config
      provider = ENV.fetch("AI_REQUIREMENTS_PROVIDER", AiRequirementsChecker::DEFAULT_PROVIDER)
      base = AiRequirementsChecker::PROVIDERS[provider]
      raise ForgeCheckService::Error, "Unknown AI provider: #{provider}" unless base
      base.merge(model: ENV.fetch("AI_REQUIREMENTS_MODEL", base[:model]))
    end
  end
end
