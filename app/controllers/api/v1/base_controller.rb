class Api::V1::BaseController < ActionController::API
  before_action :authenticate_api_key!

  private

  def authenticate_api_key!
    api_key = request.headers["Authorization"]&.delete_prefix("Bearer ")

    unless api_key.present? && ActiveSupport::SecurityUtils.secure_compare(api_key, ENV.fetch("EXTERNAL_API_KEY"))
      render json: { error: "Unauthorized" }, status: :unauthorized
    end
  end
end
