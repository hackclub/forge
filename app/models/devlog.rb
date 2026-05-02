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

  IMAGE_PATTERN = /!\[[^\]]*\]\([^)]+\)|<img\b[^>]*>/i

  validates :title, presence: true
  validates :content, presence: true
  validate :content_includes_image

  default_scope { order(created_at: :desc) }

  def content_includes_image
    return if content.blank?
    return if content.match?(IMAGE_PATTERN)

    errors.add(:content, "must include at least one image — paste or drop one into the devlog")
  end

  def parsed_hours
    return 0 unless time_spent
    match = time_spent.match(/([\d.]+)\s*([a-z]*)/i)
    return 0 unless match

    value = match[1].to_f
    unit = match[2].to_s.downcase
    minutes = unit.start_with?("m") && unit != "mo"
    minutes ? value / 60.0 : value
  end
end
