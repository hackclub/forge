# == Schema Information
#
# Table name: project_payouts
#
#  id                 :bigint           not null, primary key
#  coins              :decimal(10, 2)   not null
#  guild_multiplier   :decimal(5, 3)
#  hours              :decimal(10, 2)   not null
#  streak_at_approval :integer
#  streak_multiplier  :decimal(5, 3)
#  created_at         :datetime         not null
#  updated_at         :datetime         not null
#  project_id         :bigint           not null
#  user_id            :bigint           not null
#
# Indexes
#
#  index_project_payouts_on_project_id              (project_id)
#  index_project_payouts_on_project_id_and_user_id  (project_id,user_id) UNIQUE
#  index_project_payouts_on_user_id                 (user_id)
#
# Foreign Keys
#
#  fk_rails_...  (project_id => projects.id)
#  fk_rails_...  (user_id => users.id)
#
class ProjectPayout < ApplicationRecord
  has_paper_trail

  belongs_to :project
  belongs_to :user

  validates :hours, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :coins, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :user_id, uniqueness: { scope: :project_id }
end
