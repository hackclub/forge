class ExploreController < ApplicationController
  allow_unauthenticated_access

  FILTERS = %w[all in_progress built].freeze

  def index
    filter = FILTERS.include?(params[:filter]) ? params[:filter] : "all"

    scope = Project.kept.where(hidden: false).includes(:user, :ships)
    scope = scope.search(params[:query]) if params[:query].present?
    scope = case filter
    when "in_progress" then scope.where(status: :approved, built_at: nil)
    when "built"       then scope.where.not(built_at: nil)
    else                    scope
    end

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
          built: p.built_at.present?,
          created_at: p.created_at.strftime("%b %d, %Y")
        }
      },
      pagy: pagy_props(@pagy),
      query: params[:query].to_s,
      filter: filter
    }
  end
end
