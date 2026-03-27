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
      projects: @projects.map { |p| serialize_project_row(p) },
      can: { destroy: policy(@user).destroy?, restore: policy(@user).restore? },
      available_roles: %w[user admin reviewer],
      available_permissions: User::AVAILABLE_PERMISSIONS
    }
  end

  def destroy
    @user = User.find(params[:id])
    authorize @user
    name = @user.display_name
    if @user.discarded?
      @user.destroy
      redirect_to admin_users_path, notice: "User '#{name}' has been permanently deleted."
    else
      @user.discard
      redirect_to admin_users_path, notice: "User '#{name}' has been soft-deleted."
    end
  end

  def ban
    @user = User.find(params[:id])
    authorize @user, :destroy?
    reason = params[:ban_reason].to_s.strip
    if reason.blank?
      redirect_to admin_user_path(@user), alert: "You must provide a reason for banning."
      return
    end
    @user.update!(is_banned: true, ban_reason: reason)
    redirect_to admin_user_path(@user), notice: "#{@user.display_name} has been banned."
  end

  def unban
    @user = User.find(params[:id])
    authorize @user, :destroy?
    @user.update!(is_banned: false, ban_reason: nil)
    redirect_to admin_user_path(@user), notice: "#{@user.display_name} has been unbanned."
  end

  def restore
    @user = User.find(params[:id])
    authorize @user
    @user.undiscard
    redirect_to admin_user_path(@user), notice: "User '#{@user.display_name}' has been restored."
  end

  def update_roles
    @user = User.find(params[:id])
    authorize @user, :update?
    @user.update!(roles: params[:roles].select(&:present?))
    redirect_to admin_user_path(@user), notice: "Roles updated."
  end

  def update_permissions
    @user = User.find(params[:id])
    authorize @user, :update?
    @user.update!(permissions: Array(params[:permissions]).select(&:present?))
    redirect_to admin_user_path(@user), notice: "Permissions updated."
  end

  private

  def serialize_user_row(user)
    {
      id: user.id,
      display_name: user.display_name,
      email: user.email,
      roles: user.roles,
      projects_count: user.projects.size,
      is_banned: user.is_banned,
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
      permissions: user.permissions,
      timezone: user.timezone,
      is_banned: user.is_banned,
      ban_reason: user.ban_reason,
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
      created_at: project.created_at.strftime("%b %d, %Y")
    }
  end
end
