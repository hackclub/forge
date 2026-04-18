class Api::V1::ProjectsController < Api::V1::BaseController
  def index
    scope = Project.kept.where(hidden: false).includes(:user, :devlogs).order(created_at: :desc)
    scope = scope.where(status: params[:status]) if params[:status].present?
    scope = scope.where(tier: params[:tier]) if params[:tier].present?
    scope = scope.search(params[:query]) if params[:query].present?
    @pagy, @projects = pagy(scope)

    render json: {
      data: @projects.map { |p| serialize_project(p) },
      pagination: pagy_metadata(@pagy)
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
      description: project.description,
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
      data[:devlogs] = project.devlogs.order(created_at: :desc).map do |d|
        {
          id: d.id,
          title: d.title,
          content: d.content,
          time_spent: d.time_spent,
          status: d.status,
          approved_hours: d.approved_hours&.to_f,
          created_at: d.created_at.iso8601
        }
      end
      data[:kudos_count] = project.kudos.size
    end

    data
  end

  def pagy_metadata(pagy)
    {
      count: pagy.count,
      page: pagy.page,
      per_page: pagy.limit,
      pages: pagy.pages,
      next: pagy.next,
      prev: pagy.prev
    }
  end
end
