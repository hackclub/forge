class LeaderboardController < ApplicationController
  LIMIT = 25

  def index
    counts = Referral.group(:referrer_id).count
    top_ids = counts.sort_by { |_, v| -v }.first(LIMIT).map(&:first)
    users_by_id = User.where(id: top_ids).index_by(&:id)

    rows = top_ids.map { |id|
      u = users_by_id[id]
      next unless u

      { id: u.id, display_name: u.display_name, avatar: u.avatar, value: counts[id].to_i }
    }.compact

    render inertia: "Leaderboard/Index", props: {
      rows: rows,
      current_user_id: current_user&.id
    }
  end
end
