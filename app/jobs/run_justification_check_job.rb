class RunJustificationCheckJob < ApplicationJob
  queue_as :default

  def perform(queue_item_id)
    item = AirtableQueueItem.find_by(id: queue_item_id)
    return unless item&.pending?

    item.update_columns(justification_check: AiRequirementsChecker.check_justification(item))
  rescue AiRequirementsChecker::Error => e
    item&.update_columns(justification_check: { "overall" => "error", "message" => e.message })
    Rails.logger.error("[JustificationCheck] item=#{queue_item_id} #{e.class}: #{e.message}")
  end
end
