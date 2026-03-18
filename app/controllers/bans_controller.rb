class BansController < ApplicationController
  allow_unauthenticated_access only: %i[show]
  skip_before_action :redirect_banned_user!, only: %i[show]

  def show
    return redirect_to root_path unless current_user&.is_banned?

    render inertia: "Bans/Show"
  end
end
