# == Schema Information
#
# Table name: review_sessions
#
#  id                :bigint           not null, primary key
#  active_seconds    :integer          default(0), not null
#  decision          :string
#  ended_at          :datetime
#  heartbeats_count  :integer          default(0), not null
#  last_heartbeat_at :datetime
#  started_at        :datetime         not null
#  created_at        :datetime         not null
#  updated_at        :datetime         not null
#  project_id        :bigint           not null
#  reviewer_id       :bigint           not null
#
# Indexes
#
#  index_review_sessions_on_ended_at                    (ended_at)
#  index_review_sessions_on_project_id                  (project_id)
#  index_review_sessions_on_project_id_and_reviewer_id  (project_id,reviewer_id)
#  index_review_sessions_on_reviewer_id                 (reviewer_id)
#
# Foreign Keys
#
#  fk_rails_...  (project_id => projects.id)
#  fk_rails_...  (reviewer_id => users.id)
#
class ReviewSession < ApplicationRecord
  belongs_to :project
  belongs_to :reviewer, class_name: "User"

  scope :active, -> { where(ended_at: nil) }
  scope :ended, -> { where.not(ended_at: nil) }
  scope :completed, -> { where.not(decision: nil) }
  scope :for_reviewer, ->(user) { where(reviewer_id: user.id) }
  scope :for_project, ->(project) { where(project_id: project.id) }

  def active?
    ended_at.nil?
  end

  def end!(decision: nil)
    update!(ended_at: Time.current, decision: decision)
  end

  def heartbeat!(seconds:)
    increment = [ seconds.to_i, 0 ].max
    increment = [ increment, 120 ].min
    update!(
      active_seconds: active_seconds + increment,
      heartbeats_count: heartbeats_count + 1,
      last_heartbeat_at: Time.current
    )
  end
end
