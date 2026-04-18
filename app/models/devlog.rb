# == Schema Information
#
# Table name: devlogs
#
#  id              :bigint           not null, primary key
#  approved_hours  :decimal(, )
#  content         :text
#  review_feedback :text
#  reviewed_at     :datetime
#  status          :integer          default("draft"), not null
#  time_spent      :string
#  title           :string
#  created_at      :datetime         not null
#  updated_at      :datetime         not null
#  project_id      :bigint           not null
#  reviewer_id     :bigint
#
# Indexes
#
#  index_devlogs_on_project_id  (project_id)
#  index_devlogs_on_status      (status)
#
# Foreign Keys
#
#  fk_rails_...  (project_id => projects.id)
#  fk_rails_...  (reviewer_id => users.id)
#
class Devlog < ApplicationRecord
  has_paper_trail

  belongs_to :project
  belongs_to :reviewer, class_name: "User", optional: true

  enum :status, { draft: 0, pending: 1, approved: 2, returned: 3 }

  validates :title, presence: true
  validates :content, presence: true

  default_scope { order(created_at: :desc) }

  def parsed_hours
    return 0 unless time_spent
    match = time_spent.match(/([\d.]+)\s*(?:hrs?|hours?)/i)
    match ? match[1].to_f : 0
  end

  def credited_hours
    approved_hours.present? ? approved_hours.to_f : parsed_hours
  end
end
