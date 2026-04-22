# == Schema Information
#
# Table name: referrals
#
#  id                    :bigint           not null, primary key
#  approved_at           :datetime
#  eligible_at           :datetime
#  status                :integer          default("pending"), not null
#  created_at            :datetime         not null
#  updated_at            :datetime         not null
#  approver_id           :bigint
#  payout_adjustment_id  :bigint
#  qualifying_project_id :bigint
#  referred_id           :bigint           not null
#  referrer_id           :bigint           not null
#
# Indexes
#
#  index_referrals_on_approver_id            (approver_id)
#  index_referrals_on_payout_adjustment_id   (payout_adjustment_id)
#  index_referrals_on_qualifying_project_id  (qualifying_project_id)
#  index_referrals_on_referred_id            (referred_id) UNIQUE
#  index_referrals_on_referrer_id            (referrer_id)
#  index_referrals_on_status                 (status)
#
# Foreign Keys
#
#  fk_rails_...  (approver_id => users.id)
#  fk_rails_...  (payout_adjustment_id => coin_adjustments.id)
#  fk_rails_...  (qualifying_project_id => projects.id)
#  fk_rails_...  (referred_id => users.id)
#  fk_rails_...  (referrer_id => users.id)
#
class Referral < ApplicationRecord
  PAYOUT_AMOUNT = 0.25
  PRIZE_POOL_CONTRIBUTION = 0.1

  has_paper_trail

  belongs_to :referrer, class_name: "User"
  belongs_to :referred, class_name: "User"
  belongs_to :qualifying_project, class_name: "Project", optional: true
  belongs_to :payout_adjustment, class_name: "CoinAdjustment", optional: true
  belongs_to :approver, class_name: "User", optional: true

  enum :status, { pending: 0, eligible: 1, approved: 2 }

  validates :referred_id, uniqueness: true
  validate :cannot_refer_self

  def mark_eligible!(project)
    return unless pending?

    update!(status: :eligible, qualifying_project: project, eligible_at: Time.current)
  end

  def approve!(actor:, force: false)
    return if approved?
    return unless force || eligible?

    transaction do
      adjustment = referrer.coin_adjustments.create!(
        actor: actor,
        amount: PAYOUT_AMOUNT,
        reason: "Referral payout for #{referred.display_name}"
      )
      ReferralPrizePool.instance.contribute!(PRIZE_POOL_CONTRIBUTION)
      update!(status: :approved, approver: actor, approved_at: Time.current, payout_adjustment: adjustment)
    end
  end

  private

  def cannot_refer_self
    errors.add(:referred_id, "cannot be the referrer") if referrer_id == referred_id
  end
end
