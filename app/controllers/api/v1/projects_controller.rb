class Api::V1::ProjectsController < Api::V1::BaseController
  def index
    scope = Project.kept.where(hidden: false).includes(:user, :devlogs).order(created_at: :desc)
    scope = scope.where(status: params[:status]) if params[:status].present?
    scope = scope.where(tier: params[:tier]) if params[:tier].present?
    scope = scope.search(params[:query]) if params[:query].present?

    page = [ params.fetch(:page, 1).to_i, 1 ].max
    per_page = params.fetch(:per_page, 25).to_i.clamp(1, 100)
    total = scope.count
    projects = scope.offset((page - 1) * per_page).limit(per_page)

    render json: {
      data: projects.map { |p| serialize_project(p) },
      pagination: {
        count: total,
        page: page,
        per_page: per_page,
        pages: (total.to_f / per_page).ceil,
        next: page * per_page < total ? page + 1 : nil,
        prev: page > 1 ? page - 1 : nil
      }
    }
  end

  def show
    @project = Project.kept.includes(:user, :devlogs, :kudos).find(params[:id])

    render json: {
      data: serialize_project(@project, full: true)
    }
  end

  private

  def serialize_project(project, full: false)
    data = {
      id: project.id,
      name: project.name,
      subtitle: project.subtitle,
      description: project.subtitle,
      status: project.status,
      tier: project.tier,
      tags: project.tags,
      repo_link: project.repo_link,
      cover_image_url: project.cover_image_url,
      coin_rate: project.coin_rate,
      total_hours: project.total_hours.round(2),
      coins_earned: project.coins_earned,
      built_at: project.built_at&.iso8601,
      build_proof_url: project.build_proof_url,
      shipped: project.approved?,
      devlog_count: project.devlogs.size,
      user: {
        id: project.user.id,
        display_name: project.user.display_name,
        avatar: project.user.avatar
      },
      created_at: project.created_at.iso8601,
      updated_at: project.updated_at.iso8601
    }

    if full
      data[:devlogs] = project.devlogs.order(id: :desc).map do |d|
        {
          id: d.id,
          title: d.title,
          content: d.content,
          time_spent: d.time_spent,
          created_at: d.created_at.iso8601
        }
      end
      data[:kudos_count] = project.kudos.size
    end

    data
  end
end
