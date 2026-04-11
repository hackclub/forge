class ApplicationController < ActionController::Base
  include Authentication
  include Pundit::Authorization
  include SentryContext
  include Pagy::Method
  include InertiaPagination
  include Auditable

  before_action :gate_beta_access
  before_action :track_ahoy_visit
  before_action :set_paper_trail_whodunnit

  rescue_from Pundit::NotAuthorizedError, with: :user_not_authorized

  # Only allow modern browsers supporting webp images, web push, badges, import maps, CSS nesting, and CSS :has.
  allow_browser versions: :modern

  inertia_share auth: -> {
    {
      user: current_user&.then { |u|
        {
          id: u.id,
          display_name: u.display_name,
          email: u.email,
          avatar: u.avatar,
          roles: u.roles,
          is_admin: u.admin?,
          is_staff: u.staff?,
          is_superadmin: u.superadmin?,
          is_banned: u.is_banned
        }
      }
    }
  }
  inertia_share flash: -> { flash.to_hash }
  inertia_share sign_in_path: -> { signin_path }
  inertia_share sign_out_path: -> { signout_path }

  private

  def gate_beta_access
    return if current_user&.staff?
    return if current_user&.is_beta_approved
    return if request.path == "/rsvp" || request.path == "/rsvp/referral" || request.path.start_with?("/auth") || request.path.start_with?("/slack") || request.path.start_with?("/up") || request.path.start_with?("/rails/active_storage")

    redirect_to(current_user ? "/rsvp/referral" : "/rsvp")
  end

  def track_ahoy_visit
    return unless user_signed_in?
    return if session[:ahoy_tracked_user] == current_user.id

    if ahoy.visit && ahoy.visit.user_id != current_user.id
      ahoy.visit.update(user_id: current_user.id)
    end

    ahoy.authenticate(current_user)
    session[:ahoy_tracked_user] = current_user.id
  end

  def user_not_authorized
    flash[:alert] = "You are not authorized to perform this action."
    redirect_back(fallback_location: root_path)
  end
end
