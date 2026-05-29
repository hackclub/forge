module ForgeChecks
  class ReadmeDescribesProject < Base
    MIN_LENGTH = 200

    def self.label = "README describes the project"
    def self.source = "submitting.md"

    def call
      return skipped("No README to check.") unless ctx.readme_present?

      length = ctx.readme.length
      return fail!("README is very short (#{length} chars). Add a couple paragraphs on what the project is and why you built it.") if length < MIN_LENGTH

      pass("README is #{length} characters — looks substantial.")
    end
  end
end
