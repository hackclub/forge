class RelightController < ApplicationController
  before_action :authenticate_user!
  before_action :require_relight_enabled!

  def index
    render inertia: "Relight/Index", props: {
      stats: RelightStats.shared_props,
      my_hours: RelightStats.personal_hours(current_user)
    }
  end
end
