class Admin::ProjectsController < Admin::ApplicationController
  before_action :require_admin!

  def index
    scope = policy_scope(Project).includes(:user, :ships)
    scope = scope.search(params[:query]) if params[:query].present?
    @pagy, @projects = pagy(scope.order(created_at: :desc))

    render inertia: "Admin/Projects/Index", props: {
      projects: @projects.map { |p| serialize_project_row(p) },
      pagy: pagy_props(@pagy),
      query: params[:query].to_s
    }
  end

  def show
    @project = Project.find(params[:id])
    authorize @project
    @ships = @project.ships.includes(:reviewer).order(created_at: :desc)

    render inertia: "Admin/Projects/Show", props: {
      project: serialize_project_detail(@project),
      ships: @ships.map { |s| serialize_ship_row(s) }
    }
  end

  private

  def serialize_project_row(project)
    {
      id: project.id,
      name: project.name,
      user_id: project.user_id,
      user_display_name: project.user.display_name,
      ships_count: project.ships.size,
      is_unlisted: project.is_unlisted,
      is_discarded: project.discarded?,
      created_at: project.created_at.strftime("%b %d, %Y")
    }
  end

  def serialize_project_detail(project)
    {
      id: project.id,
      name: project.name,
      description: project.description,
      demo_link: project.demo_link,
      repo_link: project.repo_link,
      is_unlisted: project.is_unlisted,
      tags: project.tags,
      is_discarded: project.discarded?,
      discarded_at: project.discarded_at&.strftime("%b %d, %Y"),
      user_id: project.user_id,
      user_display_name: project.user.display_name
    }
  end

  def serialize_ship_row(ship)
    {
      id: ship.id,
      status: ship.status,
      reviewer_display_name: ship.reviewer&.display_name,
      approved_seconds: ship.approved_seconds,
      created_at: ship.created_at.strftime("%b %d, %Y")
    }
  end
end
