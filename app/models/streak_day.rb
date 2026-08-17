# == Schema Information
#
# Table name: streak_days
#
#  id         :bigint           not null, primary key
#  date       :date             not null
#  status     :integer          default("pending"), not null
#  created_at :datetime         not null
#  updated_at :datetime         not null
#  user_id    :bigint           not null
#
# Indexes
#
#  index_streak_days_on_user_id           (user_id)
#  index_streak_days_on_user_id_and_date  (user_id,date) UNIQUE
#
# Foreign Keys
#
#  fk_rails_...  (user_id => users.id)
#
class StreakDay < ApplicationRecord
  belongs_to :user

  enum :status, { pending: 0, active: 1, frozen: 2, missed: 3 }, prefix: true

  validates :date, presence: true, uniqueness: { scope: :user_id }

  scope :chronological, -> { order(date: :asc) }
  scope :reverse_chronological, -> { order(date: :desc) }
  scope :streak_counting, -> { where(status: [ :active, :frozen ]) }

  LOOKBACK_DAYS = 365

  def self.current_streak(user, today: user.today_in_zone)
    days = where(user: user)
      .streak_counting
      .where(date: (today - LOOKBACK_DAYS)..today)
      .reverse_chronological
      .pluck(:date)
    return 0 if days.empty?

    expected = if days.first == today
      today
    elsif days.first == today - 1
      today - 1
    else
      return 0
    end

    count = 0
    days.each do |date|
      break unless date == expected

      count += 1
      expected -= 1
    end
    count
  end

  def self.longest_streak(user)
    days = where(user: user).streak_counting.chronological.pluck(:date)
    return 0 if days.empty?

    longest = 1
    run = 1
    days.each_cons(2) do |a, b|
      run = (b == a + 1) ? run + 1 : 1
      longest = run if run > longest
    end
    longest
  end
end
