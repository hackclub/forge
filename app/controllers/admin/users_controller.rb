class Admin::UsersController < Admin::ApplicationController
  before_action :require_admin!

  def index
    scope = policy_scope(User).includes(:projects)
    scope = scope.search(params[:query]) if params[:query].present?
    @pagy, @users = pagy(scope.order(created_at: :desc))

    render inertia: "Admin/Users/Index", props: {
      users: @users.map { |u| serialize_user_row(u) },
      pagy: pagy_props(@pagy),
      query: params[:query].to_s
    }
  end

  def show
    @user = User.find(params[:id])
    authorize @user
    @projects = @user.projects.includes(:ships).order(created_at: :desc)

    render inertia: "Admin/Users/Show", props: {
      user: serialize_user_detail(@user),
      projects: @projects.map { |p| serialize_project_row(p) }
    }
  end

  private

  def serialize_user_row(user)
    {
      id: user.id,
      display_name: user.display_name,
      email: user.email,
      roles: user.roles,
      projects_count: user.projects.size,
      is_discarded: user.discarded?,
      created_at: user.created_at.strftime("%b %d, %Y")
    }
  end

  def serialize_user_detail(user)
    {
      id: user.id,
      display_name: user.display_name,
      email: user.email,
      avatar: user.avatar,
      roles: user.roles,
      timezone: user.timezone,
      is_banned: user.is_banned,
      is_discarded: user.discarded?,
      discarded_at: user.discarded_at&.strftime("%b %d, %Y"),
      created_at: user.created_at.strftime("%B %d, %Y")
    }
  end

  def serialize_project_row(project)
    {
      id: project.id,
      name: project.name,
      ships_count: project.ships.size,
      is_unlisted: project.is_unlisted,
      created_at: project.created_at.strftime("%b %d, %Y")
    }
  end
end
