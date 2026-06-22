class ReapStuckAiChecksJob < ApplicationJob
  queue_as :background

  def perform
    Project.where("ai_check_result ->> 'status' IN ('queued', 'running')").find_each do |project|
      next unless project.ai_check_stale?

      project.update_columns(ai_check_result: project.ai_check_result.merge(
        "status" => "error",
        "message" => "The check stalled before finishing — run it again.",
        "errored_at" => Time.current.iso8601
      ))
      Rails.logger.error("[AiCheck] reaped stalled check project=#{project.id} job=#{project.ai_check_result['job_id']}")
    end
  end
end
