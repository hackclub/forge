class SlackStreakLeaderboardJob < ApplicationJob
  queue_as :background

  LEADERBOARD_SIZE = 15
  MAX_RANDOM_DELAY = 4.hours
  MEDALS = %w[:first_place_medal: :second_place_medal: :third_place_medal:].freeze

  def perform(randomize = false)
    if randomize
      self.class.set(wait: rand(0..MAX_RANDOM_DELAY.to_i).seconds).perform_later
      return
    end

    channel = ENV.fetch("SLACK_STREAKS_CHANNEL_ID", nil)
    return if channel.blank?

    entries = leaderboard_entries
    return if entries.empty?

    SlackChannelMessageJob.perform_later(channel: channel, text: message_for(entries))
  end

  private

  def leaderboard_entries
    user_ids = UserActivityDay.where(active_on: 1.day.ago.to_date..).distinct.pluck(:user_id)
    User.kept.where(id: user_ids).filter_map { |user|
      streak = user.current_streak
      next if streak < 1

      { name: user.display_name, streak: streak, coins: user.coin_balance.to_f.round(1) }
    }.sort_by { |e| [ -e[:streak], -e[:coins] ] }.first(LEADERBOARD_SIZE)
  end

  def message_for(entries)
    lines = entries.each_with_index.map do |entry, i|
      rank = MEDALS[i] || "#{i + 1}."
      "#{rank} #{entry[:name]} — #{entry[:streak]} #{"day".pluralize(entry[:streak])} :coin: #{entry[:coins]}"
    end

    ":fire: *Daily Streak Leaderboard!!*\nKeep the forge burning!\n\n#{lines.join("\n")}"
  end
end
