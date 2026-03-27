class Admin::StaticPagesController < Admin::ApplicationController
  def index
    render inertia: "Admin/StaticPages/Index", props: {
      user_name: current_user.display_name,
      counts: {
        pending_reviews: Project.pending.count,
        projects: Project.kept.count,
        users: User.kept.count,
        ships: Ship.count,
        feature_flags: FeatureFlag.count
      }
    }
  end
end
