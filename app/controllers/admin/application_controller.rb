class Admin::ApplicationController < ApplicationController
  before_action :require_staff!

  private

  def require_staff!
    raise ActionController::RoutingError, "Not Found" unless current_user&.staff?
  end

  def require_admin!
    raise ActionController::RoutingError, "Not Found" unless current_user&.admin?
  end

  def require_permission!(perm)
    raise ActionController::RoutingError, "Not Found" unless current_user&.has_permission?(perm)
  end
end
