module ForgeChecks
  class ReadmeExists < Base
    def self.label = "README in repository"
    def self.source = "submitting.md"

    def call
      return pass("Found a README in your repo.") if ctx.readme_present?
      return uncertain("No README cached yet — try re-syncing your repo, or add one if you haven't.") if ctx.repo_link.blank?

      fail!("No README found in your repo. Add a `README.md` describing the project.")
    end
  end
end
