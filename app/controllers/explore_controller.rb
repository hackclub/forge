class ExploreController < ApplicationController
  allow_unauthenticated_access

  def index
    scope = Project.kept.where(hidden: false).includes(:user, :ships)
      .order(Arel.sql("cover_image_url IS NULL"), created_at: :desc)
    scope = scope.search(params[:query]) if params[:query].present?
    @pagy, @projects = pagy(scope)

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
          created_at: p.created_at.strftime("%b %d, %Y")
        }
      },
      pagy: pagy_props(@pagy),
      query: params[:query].to_s
    }
  end
end
