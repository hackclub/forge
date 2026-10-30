class SporkScreenJob < ApplicationJob
  queue_as :background
  limits_concurrency to: 2, key: "spork", duration: 10.minutes

  retry_on SporkService::RetryableError, wait: :polynomially_longer, attempts: 3 do |job, error|
    job.record_failure(job.arguments.first, error.message)
  end

  def perform(project_id)
    project = Project.kept.find_by(id: project_id)
    return unless project

    repo = SporkService.repo_slug(project.repo_link)
    return record_failure(project_id, "No public GitHub repo linked.") if repo.nil?

    summary = SporkService.screen(repo)
    SporkCheck.find_or_initialize_by(project_id: project_id)
              .update!(repo: repo, error_message: nil, checked_at: Time.current, **summary)
  rescue SporkService::RetryableError
    raise
  rescue SporkService::ScreenError => e
    record_failure(project_id, e.message)
  end

  def record_failure(project_id, message)
    check = SporkCheck.find_or_initialize_by(project_id: project_id)
    check.update!(
      repo: SporkService.repo_slug(Project.find_by(id: project_id)&.repo_link),
      verdict: "failed",
      match_count: 0,
      results: [],
      screen_errors: [],
      error_message: message,
      checked_at: Time.current
    )
  end
end
