# == Schema Information
#
# Table name: reel_comments
#
#  id         :bigint           not null, primary key
#  body       :text             not null
#  created_at :datetime         not null
#  updated_at :datetime         not null
#  reel_id    :bigint           not null
#  user_id    :bigint           not null
#
# Indexes
#
#  index_reel_comments_on_created_at  (created_at)
#  index_reel_comments_on_reel_id     (reel_id)
#  index_reel_comments_on_user_id     (user_id)
#
# Foreign Keys
#
#  fk_rails_...  (reel_id => reels.id)
#  fk_rails_...  (user_id => users.id)
#
class ReelComment < ApplicationRecord
  has_paper_trail

  belongs_to :reel, counter_cache: :comments_count
  belongs_to :user

  validates :body, presence: true, length: { maximum: 1000 }

  scope :recent, -> { order(created_at: :desc) }
end
