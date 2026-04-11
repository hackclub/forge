class Admin::StaticPagesController < Admin::ApplicationController
  def index
    counts = Rails.cache.fetch("admin/dashboard_counts", expires_in: 1.minute) do
      {
        pending_reviews: Project.kept.pending.count,
        projects: Project.kept.count,
        users: User.kept.count,
        ships: Ship.count,
        feature_flags: FeatureFlag.count,
        pending_orders: Order.pending.count
      }
    end

    render inertia: "Admin/StaticPages/Index", props: {
      user_name: current_user.display_name,
      counts: counts,
      permissions: User::AVAILABLE_PERMISSIONS.index_with { |p| current_user.has_permission?(p) },
      is_admin: current_user.admin?,
      is_superadmin: current_user.superadmin?
    }
  end

  def sync_beta_channel
    raise ActionController::RoutingError, "Not Found" unless current_user&.superadmin?

    user_ids = User.kept.where(is_beta_approved: true).where.not(slack_id: nil).pluck(:id)
    user_ids.each { |id| SlackInviteToBetaChannelJob.perform_later(id) }
    audit!("system.beta_channel_synced", metadata: { count: user_ids.size })
    redirect_to admin_root_path, notice: "Queued #{user_ids.size} beta member invites to the channel."
  end
end
