# == Schema Information
#
# Table name: devlogs
#
#  id              :bigint           not null, primary key
#  approved_hours  :decimal(, )
#  content         :text
#  entry_date      :date
#  lapse_url       :string
#  review_feedback :text
#  reviewed_at     :datetime
#  status          :integer          default("draft"), not null
#  time_hours      :decimal(8, 2)
#  time_spent      :string
#  title           :string
#  created_at      :datetime         not null
#  updated_at      :datetime         not null
#  project_id      :bigint           not null
#  reviewer_id     :bigint
#  user_id         :bigint           not null
#
# Indexes
#
#  index_devlogs_on_created_at              (created_at)
#  index_devlogs_on_project_id              (project_id)
#  index_devlogs_on_status                  (status)
#  index_devlogs_on_user_id                 (user_id)
#  index_devlogs_on_user_id_and_entry_date  (user_id,entry_date)
#
# Foreign Keys
#
#  fk_rails_...  (project_id => projects.id)
#  fk_rails_...  (reviewer_id => users.id)
#  fk_rails_...  (user_id => users.id)
#
class Devlog < ApplicationRecord
  has_paper_trail

  belongs_to :project
  belongs_to :user
  belongs_to :reviewer, class_name: "User", optional: true

  enum :status, { draft: 0, pending: 1, approved: 2, returned: 3 }

  # Default author is the project owner — covers git-journal sync and any
  # other creation path that doesn't set an author explicitly.
  before_validation { self.user ||= project&.user }
  before_validation { self.entry_date ||= (user || project&.user)&.today_in_zone || Date.current }

  after_commit :recredit_streak_day

  validates :title, presence: true
  validates :content, presence: true
  validates :lapse_url, format: { with: /\Ahttps?:\/\/\S+\z/i, message: "must be a valid URL" }, allow_blank: true

  default_scope { order(id: :desc) }

  def parsed_hours
    return time_hours if time_hours.present?
    return 0 unless time_spent

    match = time_spent.match(/([\d.]+)\s*([a-z]*)/i)
    return 0 unless match

    value = match[1].to_f
    unit = match[2].to_s.downcase
    minutes = unit.start_with?("m") && unit != "mo"
    minutes ? value / 60.0 : value
  end

  def meets_submission_requirements?
    DevlogValidator.valid_for_submission?(content)
  end

  def submission_requirement_errors
    DevlogValidator.errors_for_submission(content)
  end

  def requirement_validation_details
    DevlogValidator.validation_details(content)
  end

  private

  def recredit_streak_day
    return if user.blank?

    dates = [ entry_date, entry_date_previously_was ].compact.uniq
    counting_before = user.streak_days.streak_counting.where(date: dates).count
    dates.each { |date| StreakService.recompute_day(user, date) }

    if user.streak_days.streak_counting.where(date: dates).count > counting_before
      user.apply_streak_freezes!
    end
  rescue StandardError => e
    Rails.logger.warn("Devlog #{id}: streak recompute failed: #{e.class}: #{e.message}")
  end
end
