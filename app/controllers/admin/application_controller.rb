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
      tier_counts = Project.kept.where(status: :pending).group(Arel.sql(Project::REVIEW_TIER_SQL)).count
      {
        pending_ships: Ship.where(status: :pending).count,
        pending_pitches: Project.kept.where(status: :pitch_pending).count,
        pending_project_reviews: Project.kept.where(status: :pending).count,
        pending_reviews_tier_1: tier_counts["tier_1"].to_i,
        pending_reviews_tier_2: tier_counts["tier_2"].to_i,
        pending_reviews_tier_3: tier_counts["tier_3"].to_i,
        pending_reviews_tier_4: tier_counts["tier_4"].to_i,
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
      review_tier_1: user.has_permission?("pending_reviews") && user.has_permission?("review_tier_1"),
      review_tier_2: user.has_permission?("pending_reviews") && user.has_permission?("review_tier_2"),
      review_tier_3: user.has_permission?("pending_reviews") && user.has_permission?("review_tier_3"),
      review_tier_4: user.has_permission?("pending_reviews") && user.has_permission?("review_tier_4"),
      projects: user.has_permission?("projects"),
      users: user.has_permission?("users"),
      ships: user.has_permission?("ships"),
      feature_flags: user.has_permission?("feature_flags"),
      audit_log: user.has_permission?("audit_log"),
      jobs: user.has_permission?("jobs"),
      third_party: user.has_permission?("third_party"),
      support: user.has_permission?("support"),
      orders: user.has_permission?("orders"),
      referrals: user.has_permission?("referrals")
    }
  end
end
