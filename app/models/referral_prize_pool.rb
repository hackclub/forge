# == Schema Information
#
# Table name: referral_prize_pools
#
#  id             :bigint           not null, primary key
#  amount         :decimal(10, 2)   default(0.0), not null
#  total_paid_out :decimal(10, 2)   default(0.0), not null
#  created_at     :datetime         not null
#  updated_at     :datetime         not null
#
class ReferralPrizePool < ApplicationRecord
  has_paper_trail

  def self.instance
    first || create!(amount: 0, total_paid_out: 0)
  end

  def contribute!(delta)
    with_lock { update!(amount: amount + delta) }
  end

  def reset!
    previous = amount
    with_lock { update!(total_paid_out: total_paid_out + amount, amount: 0) }
    previous
  end
end
