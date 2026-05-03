# == Schema Information
#
# Table name: reel_kudos
#
#  id         :bigint           not null, primary key
#  created_at :datetime         not null
#  updated_at :datetime         not null
#  reel_id    :bigint           not null
#  user_id    :bigint           not null
#
# Indexes
#
#  index_reel_kudos_on_reel_id              (reel_id)
#  index_reel_kudos_on_reel_id_and_user_id  (reel_id,user_id) UNIQUE
#  index_reel_kudos_on_user_id              (user_id)
#
# Foreign Keys
#
#  fk_rails_...  (reel_id => reels.id)
#  fk_rails_...  (user_id => users.id)
#
class ReelKudo < ApplicationRecord
  belongs_to :reel, counter_cache: :kudos_count
  belongs_to :user

  validates :user_id, uniqueness: { scope: :reel_id }
end
