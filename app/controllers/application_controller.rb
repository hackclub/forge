class ApplicationController < ActionController::Base
  include Authentication
  include Pundit::Authorization
  include SentryContext
  include Pagy::Method
  include InertiaPagination
  include Auditable

  before_action :check_maintenance_mode
  before_action :track_ahoy_visit
  before_action :track_user_activity
  before_action :set_paper_trail_whodunnit
  before_action :prompt_birthday_reauth!

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
          is_banned: u.is_banned,
          current_streak: u.current_streak,
          needs_onboarding: !u.has_attribute?(:onboarded_at) || u.onboarded_at.nil?
        }
      }
    }
  }
  inertia_share flash: -> { flash.to_hash }
  inertia_share maintenance_mode: -> { FeatureFlag.enabled?("maintenance_mode") }
  inertia_share reels_enabled: -> { reels_enabled? }
  inertia_share sign_in_path: -> { signin_path }
  inertia_share sign_out_path: -> { signout_path }

  helper_method :reels_enabled?

  def reels_enabled?
    FeatureFlag.enabled?("reels") || current_user&.admin?
  end

  def require_reels_enabled!
    raise ActionController::RoutingError, "Not Found" unless reels_enabled?
  end

  private

  def check_maintenance_mode
    return unless FeatureFlag.enabled?("maintenance_mode")
    return if current_user&.staff? || current_user&.maintenance_bypass?

    render inertia: "Maintenance", props: {}
  end

  def track_user_activity
    return unless user_signed_in?

    now = Time.current
    today = now.to_date
    if session[:activity_tracked_on] != today.iso8601
      current_user.record_activity!(today)
      session[:activity_tracked_on] = today.iso8601
    end

    if current_user.last_seen_at.nil? || current_user.last_seen_at < 1.minute.ago
      current_user.update_columns(last_seen_at: now)
    end
  rescue StandardError => e
    Rails.logger.warn("track_user_activity failed: #{e.class}: #{e.message}")
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

  def prompt_birthday_reauth!
    return unless user_signed_in?
    return unless request.get?
    return if request.xhr? || request.format.json?
    return if current_user.birthday.present?
    return if session[:birthday_reauth_attempted]
    return if request.path.start_with?("/auth/", "/signin", "/sorry")

    session[:birthday_reauth_attempted] = true
    redirect_to hca_start_path, notice: "Please re-authorize Forge to finish your profile."
  end
end
