class StreakFreezeCheckJob < ApplicationJob
  queue_as :background

  # Runs hourly. For each user with freezes, if it's at least 1am in their
  # local timezone (so "yesterday" is unambiguous), call apply_streak_freezes!
  # which fills the missed day with a freeze when there's a streak to save.
  # Idempotent: a second run the same day no-ops because yesterday is already
  # in activity_days.
  def perform
    User.where("streak_freezes > 0").find_each do |user|
      now_local = Time.current.in_time_zone(user.timezone.presence || "UTC")
      next if now_local.hour < 1

      user.apply_streak_freezes!(now_local.to_date)
    rescue StandardError => e
      Rails.logger.error("StreakFreezeCheckJob failed for user #{user.id}: #{e.class}: #{e.message}")
    end
  end
end
