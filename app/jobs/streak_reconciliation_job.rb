class StreakReconciliationJob < ApplicationJob
  queue_as :background

  # Runs hourly. For each user with streak history, once it's at least 1am in
  # their local timezone (so "yesterday" is unambiguous), resolve the days since
  # their last streak-counting day — bridged with freezes when they cover the
  # whole gap, otherwise marked missed. Idempotent within a day.
  def perform
    User.kept.joins(:streak_days).distinct.find_each do |user|
      now_local = Time.current.in_time_zone(user.timezone.presence || "UTC")
      next if now_local.hour < 1

      StreakService.reconcile_missed_days(user, now_local.to_date)
    rescue StandardError => e
      Rails.logger.error("StreakReconciliationJob failed for user #{user.id}: #{e.class}: #{e.message}")
    end
  end
end
