# == Schema Information
#
# Table name: devlogs
#
#  id         :bigint           not null, primary key
#  content    :text
#  time_spent :string
#  title      :string
#  created_at :datetime         not null
#  updated_at :datetime         not null
#  project_id :bigint           not null
#
# Indexes
#
#  index_devlogs_on_project_id  (project_id)
#
# Foreign Keys
#
#  fk_rails_...  (project_id => projects.id)
#
class Devlog < ApplicationRecord
  has_paper_trail

  belongs_to :project

  validates :title, presence: true
  validates :content, presence: true

  default_scope { order(created_at: :desc) }
end
