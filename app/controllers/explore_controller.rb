class ExploreController < ApplicationController
  allow_unauthenticated_access

  def index
    scope = Project.kept.where(hidden: false).includes(:user, :ships)
    scope = scope.search(params[:query]) if params[:query].present?

    ranked = scope.fair_feed
    # Push cover-imageless projects to the bottom while preserving the score order within each group
    ranked = ranked.partition { |p| p.cover_image_url.present? }.flatten

    @pagy, @projects = pagy(ranked)

    render inertia: "Explore/Index", props: {
      projects: @projects.map { |p|
        {
          id: p.id,
          name: p.name,
          subtitle: p.subtitle,
          cover_image_url: p.cover_image_url,
          user_id: p.user_id,
          user_display_name: p.user.display_name,
          user_avatar: p.user.avatar,
          ships_count: p.ships.size,
          views_count: p.views_count,
          created_at: p.created_at.strftime("%b %d, %Y")
        }
      },
      pagy: pagy_props(@pagy),
      query: params[:query].to_s
    }
  end
end
