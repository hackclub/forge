# == Schema Information
#
# Table name: badges
#
#  id          :bigint           not null, primary key
#  awarded_at  :datetime         not null
#  color       :string           default("orange"), not null
#  description :text
#  icon        :string           default("military_tech"), not null
#  key         :string
#  name        :string           not null
#  created_at  :datetime         not null
#  updated_at  :datetime         not null
#  awarder_id  :bigint
#  user_id     :bigint           not null
#
# Indexes
#
#  index_badges_on_awarder_id       (awarder_id)
#  index_badges_on_user_id          (user_id)
#  index_badges_on_user_id_and_key  (user_id,key) UNIQUE WHERE (key IS NOT NULL)
#
# Foreign Keys
#
#  fk_rails_...  (awarder_id => users.id)
#  fk_rails_...  (user_id => users.id)
#
class Badge < ApplicationRecord
  has_paper_trail

  belongs_to :user
  belongs_to :awarder, class_name: "User", optional: true

  COLORS = %w[orange emerald amber red purple blue stone].freeze

  ORPH_QUEST_KEY = "orph_motivation_quest".freeze
  ORPH_QUEST_GOAL = 100

  validates :name, presence: true
  validates :icon, presence: true
  validates :awarded_at, presence: true
  validates :color, inclusion: { in: COLORS }
  validates :key, uniqueness: { scope: :user_id, allow_nil: true }

  def self.award_orph_quest!(user)
    return if user.badges.exists?(key: ORPH_QUEST_KEY)
    return if Project.kept.where(status: :approved).count > ORPH_QUEST_GOAL

    user.badges.create!(
      key: ORPH_QUEST_KEY,
      name: "Orph's Motivation",
      description: "Shipped an approved project to help cheer Orph back up before the community reached #{ORPH_QUEST_GOAL}.",
      icon: "flag",
      color: "orange",
      awarded_at: Time.current
    )
  rescue ActiveRecord::RecordNotUnique
    nil
  end
end
