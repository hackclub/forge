class Admin::StaticPagesController < Admin::ApplicationController
  def index
    counts = Rails.cache.fetch("admin/dashboard_counts", expires_in: 1.minute) do
      {
        pending_reviews: Project.pending.count,
        projects: Project.kept.count,
        users: User.kept.count,
        ships: Ship.count,
        feature_flags: FeatureFlag.count
      }
    end

    render inertia: "Admin/StaticPages/Index", props: {
      user_name: current_user.display_name,
      counts: counts
    }
  end
end
