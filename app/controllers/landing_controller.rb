class LandingController < ApplicationController
  allow_unauthenticated_access only: %i[index]

  def index
    return redirect_to home_path if user_signed_in?

    render inertia: "Landing/Index"
  end
end
