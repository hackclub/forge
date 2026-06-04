class LeaderboardController < ApplicationController
  LIMIT = 25

  GUILD_ICONS = {
    "rivendell" => "park",
    "erebor"    => "construction",
    "edoras"    => "bolt",
    "valinor"   => "auto_awesome"
  }.freeze

  def index
    hours_totals = compute_hours_totals
    streak_user_ids = User.kept.joins(:activity_days).distinct.pluck(:id)
    streak_totals = streak_user_ids.to_h { |id| [ id, User.find(id).current_streak ] }
    streak_totals.reject! { |_, v| v.zero? }

    hours_ids = hours_totals.select { |_, v| v > 0 }.sort_by { |_, v| -v }.first(LIMIT).map(&:first)
    streak_ids = streak_totals.sort_by { |_, v| -v }.first(LIMIT).map(&:first)

    users = User.kept.where(id: (hours_ids + streak_ids).uniq).index_by(&:id)

    build = ->(id, value) {
      u = users[id]
      next unless u

      {
        id: u.id,
        display_name: u.display_name,
        avatar: u.avatar,
        value: value,
        hours: (hours_totals[id] || 0.0).round(1),
        streak: streak_totals[id].to_i
      }
    }

    guild_referrals = compute_guild_referrals

    render inertia: "Leaderboard/Index", props: {
      guild_referrals: guild_referrals,
      mine_guild: current_user&.guild,
      hours: hours_ids.filter_map { |id| build.call(id, (hours_totals[id] || 0).round(1)) },
      streaks: streak_ids.filter_map { |id| build.call(id, streak_totals[id].to_i) },
      current_user_id: current_user&.id
    }
  end

  private

  def compute_hours_totals
    totals = Hash.new(0.0)
    Project.kept.where(hidden: false).not_shadow_banned.includes(:devlogs).find_each do |project|
      totals[project.user_id] += project.devlog_hours
    end
    totals
  end

  def compute_guild_referrals
    counts = Referral.joins(:referrer).where.not(users: { guild: nil }).group("users.guild").count
    User.guilds.map { |name, idx|
      { name: name, icon: GUILD_ICONS.fetch(name), value: counts[idx] || 0 }
    }.sort_by { |row| -row[:value] }
  end
end
