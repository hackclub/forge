class Api::V1::UsersController < Api::V1::BaseController
  def show
    user = User.kept.find(params[:id])
    projects = user.projects.kept.where(hidden: false).includes(:devlogs).order(created_at: :desc)

    render json: {
      data: {
        id: user.id,
        display_name: user.display_name,
        avatar: user.avatar,
        github_username: user.github_username,
        joined_at: user.created_at.iso8601,
        stats: {
          total_hours: projects.sum(&:total_hours).round(2),
          projects_count: projects.size,
          current_streak: user.current_streak,
          longest_streak: user.longest_streak
        },
        projects: projects.map do |p|
          {
            id: p.id,
            name: p.name,
            subtitle: p.subtitle,
            status: p.status,
            tier: p.tier,
            cover_image_url: p.cover_image_url,
            total_hours: p.total_hours.round(2),
            created_at: p.created_at.iso8601
          }
        end
      }
    }
  end
end
