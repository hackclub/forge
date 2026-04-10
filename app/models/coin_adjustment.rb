# == Schema Information
#
# Table name: coin_adjustments
#
#  id         :bigint           not null, primary key
#  amount     :decimal(10, 2)   not null
#  reason     :text             not null
#  created_at :datetime         not null
#  updated_at :datetime         not null
#  actor_id   :bigint
#  user_id    :bigint           not null
#
# Indexes
#
#  index_coin_adjustments_on_actor_id  (actor_id)
#  index_coin_adjustments_on_user_id   (user_id)
#
# Foreign Keys
#
#  fk_rails_...  (actor_id => users.id)
#  fk_rails_...  (user_id => users.id)
#
class CoinAdjustment < ApplicationRecord
  has_paper_trail

  belongs_to :user
  belongs_to :actor, class_name: "User", optional: true

  validates :amount, numericality: { other_than: 0 }
  validates :reason, presence: true
end
