module Auditable
  extend ActiveSupport::Concern

  def audit!(action, target: nil, metadata: {}, label: nil)
    AuditEvent.create!(
      actor: current_user,
      action: action.to_s,
      target: target,
      target_label: label || resolve_target_label(target),
      metadata: metadata,
      ip_address: request.remote_ip
    )
  rescue StandardError => e
    Rails.logger.error("Audit log failed: #{e.class}: #{e.message}")
  end

  private

  def resolve_target_label(target)
    return nil unless target

    if target.respond_to?(:display_name) && target.display_name.present?
      target.display_name
    elsif target.respond_to?(:name) && target.name.present?
      target.name
    elsif target.respond_to?(:title) && target.title.present?
      target.title
    else
      "##{target.id}"
    end
  end
end
