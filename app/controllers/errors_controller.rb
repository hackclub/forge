class ErrorsController < ApplicationController
  skip_before_action :track_ahoy_visit

  def not_found
    render inertia: "Errors/NotFound", props: {}, status: :not_found
  end
end
