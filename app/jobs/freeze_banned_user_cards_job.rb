class FreezeBannedUserCardsJob < ApplicationJob
  queue_as :default

  def perform(user_id)
    user = User.find_by(id: user_id)
    return unless user&.is_banned? && HcbService.connected?

    orders = user.orders.where.not(hcb_grant_link: [ nil, "" ]).where(hcb_card_frozen_at: nil)
    orders.group_by { |order| HcbService.grant_public_id(order.hcb_grant_link) }.each do |grant_id, grant_orders|
      next if grant_id.blank?

      card_id = HcbService.fetch_card_grant(grant_id)[:card_id]
      next if card_id.blank?

      HcbService.freeze_card!(card_id)
      Order.where(id: grant_orders.map(&:id)).update_all(hcb_card_frozen_at: Time.current)
    rescue HcbService::Error => e
      Rails.logger.error("FreezeBannedUserCardsJob failed for grant #{grant_id}: #{e.class}: #{e.message}")
    end
  end
end
