module ForgeChecks
  class HasSubtitle < Base
    def self.label = "Project description"
    def self.source = "submitting.md"

    def call
      subtitle = ctx.project.subtitle.to_s.strip
      return fail!("Add a short description of your project on Forge.") if subtitle.empty?
      return fail!("Your description is very short (#{subtitle.length} chars) — add a bit more so reviewers know what you built.") if subtitle.length < 20

      pass("Description: \"#{subtitle.truncate(60)}\".")
    end
  end
end
