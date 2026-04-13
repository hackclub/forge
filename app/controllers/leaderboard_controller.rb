class LeaderboardController < ApplicationController
  LIMIT = 25

  def index
    referral_counts = Referral.group(:referrer_id).count
    hours_totals = compute_hours_totals
    streak_user_ids = User.kept.joins(:activity_days).distinct.pluck(:id)
    streak_totals = streak_user_ids.to_h { |id| [ id, User.find(id).longest_streak ] }

    referral_ids = referral_counts.sort_by { |_, v| -v }.first(LIMIT).map(&:first)
    hours_ids = hours_totals.sort_by { |_, v| -v }.first(LIMIT).map(&:first)
    streak_ids = streak_totals.sort_by { |_, v| -v }.first(LIMIT).map(&:first)

    users = User.kept.where(id: (referral_ids + hours_ids + streak_ids).uniq).index_by(&:id)

    build = ->(id, value) {
      u = users[id]
      next unless u

      {
        id: u.id,
        display_name: u.display_name,
        avatar: u.avatar,
        value: value,
        referrals: referral_counts[id].to_i,
        hours: (hours_totals[id] || 0.0).round(1),
        streak: streak_totals[id].to_i
      }
    }

    render inertia: "Leaderboard/Index", props: {
      referrals: referral_ids.filter_map { |id| build.call(id, referral_counts[id].to_i) },
      hours: hours_ids.filter_map { |id| build.call(id, (hours_totals[id] || 0).round(1)) },
      streaks: streak_ids.filter_map { |id| build.call(id, streak_totals[id].to_i) },
      current_user_id: current_user&.id
    }
  end

  private

  def compute_hours_totals
    totals = Hash.new(0.0)
    Project.kept.where(hidden: false).includes(:devlogs).find_each do |project|
      totals[project.user_id] += project.total_hours
    end
    totals
  end
end
