module ForgeChecks
  class RepoLinked < Base
    def self.label = "Repository linked"
    def self.source = "submitting.md"

    def call
      return pass("Repo linked: #{ctx.repo_link}.") if ctx.repo_link.present?

      fail!("No repository linked. Forge needs a public git repo (GitHub or GitLab works).")
    end
  end
end
