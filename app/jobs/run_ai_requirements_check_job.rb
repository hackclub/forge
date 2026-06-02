class RunAiRequirementsCheckJob < ApplicationJob
  queue_as :default

  def perform(project_id, provider: nil)
    project = Project.find_by(id: project_id)
    return unless project

    project.update!(ai_check_result: { "status" => "running", "started_at" => Time.current.iso8601 })

    FetchReadmeJob.perform_now(project.id) if project.repo_link.present?
    project.reload

    result = ForgeCheckService.run(project)
    project.update!(
      ai_check_result: result.merge("status" => "done"),
      ai_check_ran_at: Time.current
    )
  rescue ForgeCheckService::Error, AiRequirementsChecker::Error => e
    project&.update!(ai_check_result: { "status" => "error", "message" => e.message, "errored_at" => Time.current.iso8601 })
  end
end
