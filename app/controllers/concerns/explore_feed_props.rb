module ExploreFeedProps
  extend ActiveSupport::Concern

  FILTERS = %w[all in_progress built].freeze

  private

  def explore_feed_props
    filter = FILTERS.include?(params[:filter]) ? params[:filter] : "all"

    scope = Project.kept.where(hidden: false).includes(:user, :ships)
    scope = scope.search(params[:query]) if params[:query].present?
    scope = case filter
    when "in_progress" then scope.where(status: :approved, built_at: nil)
    when "built"       then scope.where.not(built_at: nil)
    else                    scope
    end

    ranked = Project.fair_feed(scope)
    ranked = ranked.partition { |p| p.cover_image_url.present? }.flatten

    pagy_obj, projects = pagy(ranked)

    {
      projects: projects.map { |p|
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
      pagy: pagy_props(pagy_obj),
      query: params[:query].to_s,
      filter: filter
    }
  end
end
