class LeaderboardController < ApplicationController
  include LeaderboardProps

  def index
    render inertia: "Leaderboard/Index", props: leaderboard_props
  end
end
