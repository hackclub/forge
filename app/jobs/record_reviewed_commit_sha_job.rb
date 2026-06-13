class RecordReviewedCommitShaJob < ApplicationJob
  queue_as :default

  def perform(project_id)
    project = Project.find_by(id: project_id)
    return unless project

    sha = ForgeChecks::Context.new(project).head_sha
    return if sha.blank?

    project.update_column(:reviewed_commit_sha, sha)
  end
end
