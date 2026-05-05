# == Schema Information
#
# Table name: reel_comments
#
#  id         :bigint           not null, primary key
#  body       :text             not null
#  created_at :datetime         not null
#  updated_at :datetime         not null
#  parent_id  :bigint
#  reel_id    :bigint           not null
#  user_id    :bigint           not null
#
# Indexes
#
#  index_reel_comments_on_created_at  (created_at)
#  index_reel_comments_on_parent_id   (parent_id)
#  index_reel_comments_on_reel_id     (reel_id)
#  index_reel_comments_on_user_id     (user_id)
#
# Foreign Keys
#
#  fk_rails_...  (parent_id => reel_comments.id) ON DELETE => cascade
#  fk_rails_...  (reel_id => reels.id)
#  fk_rails_...  (user_id => users.id)
#
class ReelComment < ApplicationRecord
  has_paper_trail

  belongs_to :reel, counter_cache: :comments_count
  belongs_to :user
  belongs_to :parent, class_name: "ReelComment", optional: true
  has_many :replies, class_name: "ReelComment", foreign_key: :parent_id, dependent: :destroy

  validates :body, presence: true, length: { maximum: 1000 }
  validate :parent_must_be_top_level

  scope :recent, -> { order(created_at: :desc) }
  scope :top_level, -> { where(parent_id: nil) }

  def reply?
    parent_id.present?
  end

  private

  def parent_must_be_top_level
    return if parent.blank?
    errors.add(:parent_id, "can't be a reply itself") if parent.parent_id.present?
    errors.add(:parent_id, "must belong to the same reel") if parent.reel_id != reel_id
  end
end
