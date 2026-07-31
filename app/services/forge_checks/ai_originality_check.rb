module ForgeChecks
  class AiOriginalityCheck < Base
    def self.label = "Originality of work"
    def self.source = "project-guidelines.md"
    def self.needs_ai? = true

    SCHEMA = {
      type: "object",
      properties: {
        verdict: { type: "string", enum: %w[pass fail uncertain] },
        reasoning: { type: "string" }
      },
      required: %w[verdict reasoning],
      additionalProperties: false
    }.freeze

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

        Give a verdict and one short sentence of reasoning.
      PROMPT

      parsed = AiRequirementsChecker.complete_json(prompt, schema: SCHEMA)
      verdict = %w[pass fail uncertain].include?(parsed["verdict"].to_s) ? parsed["verdict"].to_s : "uncertain"
      reasoning = parsed["reasoning"].to_s.truncate(400)

      result(verdict, reasoning.presence || "Reviewed README and devlogs for originality.")
    rescue AiRequirementsChecker::Error => e
      Rails.logger.error("[AiOriginalityCheck] degraded: #{e.message}")
      uncertain("AI originality check unavailable — please verify yourself.")
    rescue StandardError
      uncertain("AI originality check failed — please verify yourself.")
    end
  end
end
