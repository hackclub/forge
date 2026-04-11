# == Schema Information
#
# Table name: kudos
#
#  id         :bigint           not null, primary key
#  content    :text             not null
#  created_at :datetime         not null
#  updated_at :datetime         not null
#  author_id  :bigint           not null
#  project_id :bigint
#  user_id    :bigint           not null
#
# Indexes
#
#  index_kudos_on_author_id   (author_id)
#  index_kudos_on_project_id  (project_id)
#  index_kudos_on_user_id     (user_id)
#
# Foreign Keys
#
#  fk_rails_...  (author_id => users.id)
#  fk_rails_...  (project_id => projects.id)
#  fk_rails_...  (user_id => users.id)
#
class Kudo < ApplicationRecord
  has_paper_trail

  belongs_to :user
  belongs_to :author, class_name: "User"
  belongs_to :project, optional: true

  validates :content, presence: true
end
