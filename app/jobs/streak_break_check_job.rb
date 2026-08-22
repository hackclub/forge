class StreakBreakCheckJob < ApplicationJob
  queue_as :background

  MIN_STREAK_TO_ANNOUNCE = 3
  MAX_RANDOM_DELAY = 50.minutes

  def perform(randomize = true)
    channel = ENV.fetch("SLACK_STREAKS_CHANNEL_ID", nil)
    return if channel.blank?

    recently_active = StreakDay.streak_counting.where(date: 4.days.ago.to_date..).select(:user_id)
    User.kept.where.not(slack_id: nil).where(id: recently_active).find_each do |user|
      announce_break(user, channel, randomize)
    rescue StandardError => e
      Rails.logger.error("StreakBreakCheckJob failed for user #{user.id}: #{e.class}: #{e.message}")
    end
  end

  private

  def announce_break(user, channel, randomize)
    today = user.today_in_zone
    now_local = Time.current.in_time_zone(user.timezone.presence || "UTC")
    return if now_local.hour < 1

    StreakService.refresh_recent_days(user, today)

    yesterday = today - 1
    return if user.streak_days.streak_counting.exists?(date: yesterday)
    return unless user.streak_days.streak_counting.exists?(date: yesterday - 1)

    streak = broken_streak_length(user, yesterday - 1)
    return if streak < MIN_STREAK_TO_ANNOUNCE
    return if StreakBreakNotice.exists?(user: user, broke_on: yesterday)

    StreakBreakNotice.create!(user: user, broke_on: yesterday, streak_length: streak)

    text = ":broken_heart: <@#{user.slack_id}> broke their #{streak} day streak :shocked:. The forge slowly dies, FEED IT HOURS TO REKINDLE THE ANCIENT FORGE"
    wait = randomize ? rand(0..MAX_RANDOM_DELAY.to_i).seconds : 0.seconds
    SlackChannelMessageJob.set(wait: wait).perform_later(channel: channel, text: text)
  rescue ActiveRecord::RecordNotUnique
    nil
  end

  def broken_streak_length(user, last_active_day)
    dates = user.streak_days
      .streak_counting
      .where(date: (last_active_day - 365)..last_active_day)
      .order(date: :desc)
      .pluck(:date)
      .to_set

    streak = 0
    cursor = last_active_day
    while dates.include?(cursor)
      streak += 1
      cursor -= 1
    end
    streak
  end
end
