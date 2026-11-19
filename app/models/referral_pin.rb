# == Schema Information
#
# Table name: referral_pins
#
#  id         :bigint           not null, primary key
#  milestone  :integer          not null
#  created_at :datetime         not null
#  updated_at :datetime         not null
#  order_id   :bigint           not null
#  user_id    :bigint           not null
#
# Indexes
#
#  index_referral_pins_on_order_id               (order_id)
#  index_referral_pins_on_user_id                (user_id)
#  index_referral_pins_on_user_id_and_milestone  (user_id,milestone) UNIQUE
#
# Foreign Keys
#
#  fk_rails_...  (order_id => orders.id)
#  fk_rails_...  (user_id => users.id)
#
class ReferralPin < ApplicationRecord
  has_paper_trail

  belongs_to :user
  belongs_to :order

  validates :milestone, numericality: { only_integer: true, greater_than: 0 }, uniqueness: { scope: :user_id }

  after_create_commit :notify_fulfillment

  def self.award_due!(user)
    earned = user.referrals_made.approved.count / Referral::PIN_THRESHOLD
    existing = user.referral_pins.pluck(:milestone)

    (1..earned).map { |n| n * Referral::PIN_THRESHOLD }.reject { |m| existing.include?(m) }.map do |milestone|
      order = user.orders.create!(
        kind: "referral_pin",
        coin_cost: 0,
        status: :approved,
        region: user.region || "rest_of_world",
        description: "Earned for #{milestone} referrals"
      )
      user.referral_pins.create!(milestone: milestone, order: order)
    end
  end

  def shipped?
    order.fulfilled?
  end

  private

  def notify_fulfillment
    FulfillmentNotifyJob.perform_later(order_id)
  end
end
