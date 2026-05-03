# == Schema Information
#
# Table name: reel_payout_requests
#
#  id          :bigint           not null, primary key
#  amount      :decimal(10, 2)   not null
#  reason      :text
#  reviewed_at :datetime
#  status      :string           default("pending"), not null
#  created_at  :datetime         not null
#  updated_at  :datetime         not null
#  reel_id     :bigint           not null
#  reviewer_id :bigint
#
# Indexes
#
#  index_reel_payout_requests_on_created_at   (created_at)
#  index_reel_payout_requests_on_reel_id      (reel_id)
#  index_reel_payout_requests_on_reviewer_id  (reviewer_id)
#  index_reel_payout_requests_on_status       (status)
#
# Foreign Keys
#
#  fk_rails_...  (reel_id => reels.id)
#  fk_rails_...  (reviewer_id => users.id)
#
class ReelPayoutRequest < ApplicationRecord
  has_paper_trail

  belongs_to :reel
  belongs_to :reviewer, class_name: "User", optional: true

  STATUSES = %w[pending approved rejected].freeze

  validates :amount, numericality: { greater_than: 0 }
  validates :status, inclusion: { in: STATUSES }

  scope :pending,  -> { where(status: "pending") }
  scope :approved, -> { where(status: "approved") }
  scope :rejected, -> { where(status: "rejected") }
  scope :recent,   -> { order(created_at: :desc) }

  def pending?  = status == "pending"
  def approved? = status == "approved"
  def rejected? = status == "rejected"

  def approve!(by_user)
    return false unless pending?
    transaction do
      reel.user.coin_adjustments.create!(
        actor: by_user,
        amount: amount,
        reason: "Reel ##{reel.id} engagement payout"
      )
      reel.update!(lifetime_payout_coins: reel.lifetime_payout_coins + amount)
      update!(status: "approved", reviewer: by_user, reviewed_at: Time.current)
    end
    true
  end

  def reject!(by_user, reason: nil)
    return false unless pending?
    update!(status: "rejected", reviewer: by_user, reviewed_at: Time.current, reason: reason)
  end
end
