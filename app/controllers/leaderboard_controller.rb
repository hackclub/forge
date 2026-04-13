class LeaderboardController < ApplicationController
  LIMIT = 25

  def index
    render inertia: "Leaderboard/Index", props: {
      referrals: top_referrals,
      hours: top_hours,
      streaks: top_streaks,
      current_user_id: current_user&.id
    }
  end

  private

  def top_referrals
    counts = Referral.group(:referrer_id).count
    ids = counts.sort_by { |_, v| -v }.first(LIMIT).map(&:first)
    users = User.kept.where(id: ids).index_by(&:id)

    ids.filter_map { |id| users[id] && row(users[id], counts[id].to_i) }
  end

  def top_hours
    totals = {}
    Project.kept.where(hidden: false).includes(:devlogs).find_each do |project|
      totals[project.user_id] ||= 0.0
      totals[project.user_id] += project.total_hours
    end

    ids = totals.sort_by { |_, v| -v }.first(LIMIT).map(&:first)
    users = User.kept.where(id: ids).index_by(&:id)

    ids.filter_map { |id| users[id] && row(users[id], totals[id].round(1)) }
  end

  def top_streaks
    ids = User.kept.joins(:activity_days).distinct.pluck(:id)
    best = ids.map { |id| [ id, User.find(id).longest_streak ] }
             .sort_by { |_, v| -v }
             .first(LIMIT)

    users = User.kept.where(id: best.map(&:first)).index_by(&:id)
    best.filter_map { |id, streak| users[id] && row(users[id], streak) }
  end

  def row(user, value)
    { id: user.id, display_name: user.display_name, avatar: user.avatar, value: value }
  end
end
