class RunAiRequirementsCheckJob < ApplicationJob
  queue_as :default

  def perform(project_id, provider: nil)
    project = Project.find_by(id: project_id)
    return unless project

    project.update_columns(ai_check_result: { "status" => "running", "started_at" => Time.current.iso8601, "job_id" => job_id })

    if project.repo_link.present?
      # Fetch README text only — skip the slow per-image CDN mirroring on the
      # check's critical path, then mirror images in the background for rendering.
      FetchReadmeJob.perform_now(project.id, mirror: false)
      FetchReadmeJob.perform_later(project.id) if HcCdnService.enabled?
    end
    project.reload

    result = ForgeCheckService.run(project)
    project.update_columns(
      ai_check_result: result.merge("status" => "done"),
      ai_check_ran_at: Time.current
    )
  rescue ForgeCheckService::Error, AiRequirementsChecker::Error => e
    project&.update_columns(ai_check_result: { "status" => "error", "message" => e.message, "errored_at" => Time.current.iso8601, "job_id" => job_id })
  rescue StandardError => e
    project&.update_columns(ai_check_result: { "status" => "error", "message" => "The check hit an unexpected error (#{e.class.name}) — run it again.", "errored_at" => Time.current.iso8601, "job_id" => job_id })
    raise
  end
end
