class Admin::ApplicationController < ApplicationController
  before_action :require_staff!

  inertia_share admin_stats: -> { admin_stats_payload }
  inertia_share admin_permissions: -> { admin_permissions_payload }

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

  def admin_stats_payload
    Rails.cache.fetch("admin/sidebar_stats", expires_in: 1.minute) do
      {
        pending_ships: Ship.where(status: :pending).count,
        pending_pitches: Project.kept.where(status: :pitch_pending).count,
        pending_project_reviews: Project.kept.where(status: :pending).count,
        projects: Project.kept.count,
        users: User.kept.count,
        pending_orders: Order.pending.count,
        feature_flags: FeatureFlag.count
      }
    end
  end

  def admin_permissions_payload
    user = current_user
    return {} unless user

    {
      is_admin: user.admin?,
      is_superadmin: user.superadmin?,
      pending_reviews: user.has_permission?("pending_reviews"),
      projects: user.has_permission?("projects"),
      users: user.has_permission?("users"),
      ships: user.has_permission?("ships"),
      feature_flags: user.has_permission?("feature_flags"),
      audit_log: user.has_permission?("audit_log"),
      jobs: user.has_permission?("jobs"),
      third_party: user.has_permission?("third_party"),
      support: user.has_permission?("support"),
      news: user.has_permission?("news"),
      orders: user.has_permission?("orders"),
      referrals: user.has_permission?("referrals")
    }
  end
end
