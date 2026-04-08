class Admin::UsersController < Admin::ApplicationController
  before_action :require_users_permission!

  def index
    scope = policy_scope(User).includes(:projects)
    scope = scope.search(params[:query]) if params[:query].present?
    scope = scope.where("? = ANY(roles)", params[:role]) if params[:role].present?
    @pagy, @users = pagy(scope.order(created_at: :desc))

    render inertia: "Admin/Users/Index", props: {
      users: @users.map { |u| serialize_user_row(u) },
      pagy: pagy_props(@pagy),
      query: params[:query].to_s,
      role_filter: params[:role].to_s,
      available_roles: %w[user admin reviewer support fulfillment]
    }
  end

  def show
    @user = User.find(params[:id])
    authorize @user
    @projects = @user.projects.includes(:ships).order(created_at: :desc)

    render inertia: "Admin/Users/Show", props: {
      user: serialize_user_detail(@user),
      projects: @projects.map { |p| serialize_project_row(p) },
      notes: @user.user_notes.includes(:author).order(created_at: :desc).map { |n| serialize_note(n) },
      can: { destroy: policy(@user).destroy?, restore: policy(@user).restore? },
      available_roles: %w[user admin reviewer support fulfillment],
      available_permissions: User::AVAILABLE_PERMISSIONS
    }
  end

  def add_note
    @user = User.find(params[:id])
    authorize @user, :show?
    @user.user_notes.create!(content: params[:content], author: current_user)
    redirect_to admin_user_path(@user), notice: "Note added."
  end

  def destroy_note
    @user = User.find(params[:id])
    authorize @user, :show?
    note = @user.user_notes.find(params[:note_id])
    note.destroy
    redirect_to admin_user_path(@user), notice: "Note deleted."
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
    new_roles = params[:roles].select(&:present?)
    added_roles = new_roles - @user.roles
    @user.roles = new_roles
    added_roles.each { |role| @user.apply_default_permissions_for_role(role) }
    @user.save!
    redirect_to admin_user_path(@user), notice: "Roles updated."
  end

  def update_permissions
    @user = User.find(params[:id])
    authorize @user, :update?
    @user.update!(permissions: Array(params[:permissions]).select(&:present?))
    redirect_to admin_user_path(@user), notice: "Permissions updated."
  end

  def toggle_beta_approval
    @user = User.find(params[:id])
    authorize @user, :update?
    @user.update!(is_beta_approved: !@user.is_beta_approved)
    redirect_to admin_user_path(@user), notice: @user.is_beta_approved ? "#{@user.display_name} approved for beta." : "Beta access revoked."
  end

  private

  def require_users_permission!
    require_permission!("users")
  end

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
      is_beta_approved: user.is_beta_approved,
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

  def serialize_note(note)
    {
      id: note.id,
      content: note.content,
      author_name: note.author.display_name,
      author_avatar: note.author.avatar,
      created_at: note.created_at.strftime("%b %d, %Y %H:%M")
    }
  end
end
