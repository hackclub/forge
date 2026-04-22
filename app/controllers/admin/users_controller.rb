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

    hackatime = current_user.has_permission?("hackatime") ? HackatimeService.get_trust_info(slack_id: @user.slack_id, email: @user.email) : nil

    render inertia: "Admin/Users/Show", props: {
      user: serialize_user_detail(@user),
      projects: @projects.map { |p| serialize_project_row(p) },
      notes: @user.user_notes.includes(:author).order(created_at: :desc).map { |n| serialize_note(n) },
      kudos: @user.kudos.includes(:author).order(created_at: :desc).map { |k| serialize_kudo(k) },
      coins: {
        balance: @user.coin_balance,
        earned: @user.coins_earned.round(2),
        spent: @user.coins_spent.round(2),
        adjusted: @user.coins_adjusted.round(2)
      },
      coin_adjustments: @user.coin_adjustments.includes(:actor).order(created_at: :desc).map { |a| serialize_adjustment(a) },
      hackatime: hackatime ? serialize_hackatime(hackatime) : nil,
      can: { destroy: policy(@user).destroy?, restore: policy(@user).restore? },
      available_roles: %w[user admin reviewer support fulfillment],
      available_permissions: User::AVAILABLE_PERMISSIONS,
      available_regions: HasRegion::REGIONS
    }
  end

  def add_kudo
    @user = User.find(params[:id])
    authorize @user, :show?
    kudo = @user.kudos.create!(content: params[:content], author: current_user)
    audit!("user.kudo_added", target: @user, metadata: { kudo_id: kudo.id, content: kudo.content })
    redirect_to admin_user_path(@user), notice: "Kudos added."
  end

  def destroy_kudo
    @user = User.find(params[:id])
    authorize @user, :show?
    kudo = @user.kudos.find(params[:kudo_id])
    audit!("user.kudo_destroyed", target: @user, metadata: { kudo_id: kudo.id, content: kudo.content })
    kudo.destroy
    redirect_to admin_user_path(@user), notice: "Kudos deleted."
  end

  def coin_history
    @user = User.find(params[:id])
    authorize @user, :show?

    render inertia: "Admin/Users/CoinHistory", props: {
      user: {
        id: @user.id,
        display_name: @user.display_name,
        avatar: @user.avatar
      },
      coins: {
        balance: @user.coin_balance,
        earned: @user.coins_earned.round(2),
        spent: @user.coins_spent.round(2),
        adjusted: @user.coins_adjusted.round(2)
      },
      entries: CoinHistory.new(@user).serialize
    }
  end

  def toggle_shop_unlocked
    @user = User.find(params[:id])
    authorize @user, :update?
    @user.update!(shop_unlocked: !@user.shop_unlocked)
    audit!("user.shop_unlocked_toggled", target: @user, metadata: { shop_unlocked: @user.shop_unlocked })
    redirect_to admin_user_path(@user), notice: @user.shop_unlocked? ? "#{@user.display_name}'s shop access unlocked." : "#{@user.display_name}'s shop access locked."
  end

  def toggle_maintenance_bypass
    @user = User.find(params[:id])
    authorize @user, :update?
    @user.update!(maintenance_bypass: !@user.maintenance_bypass)
    audit!("user.maintenance_bypass_toggled", target: @user, metadata: { maintenance_bypass: @user.maintenance_bypass })
    status = @user.maintenance_bypass? ? "can now bypass maintenance" : "no longer bypasses maintenance"
    redirect_to admin_user_path(@user), notice: "#{@user.display_name} #{status}."
  end

  def generate_referral_code
    @user = User.find(params[:id])
    authorize @user, :update?

    loop do
      candidate = SecureRandom.alphanumeric(8).upcase
      unless User.exists?(referral_code: candidate)
        @user.update!(referral_code: candidate)
        break
      end
    end

    audit!("user.referral_code_generated", target: @user, metadata: { referral_code: @user.referral_code })
    redirect_to admin_user_path(@user), notice: "Referral code generated: #{@user.referral_code}"
  end

  def update_fulfillment_regions
    @user = User.find(params[:id])
    authorize @user, :update?
    regions = Array(params[:fulfillment_regions]).select(&:present?) & HasRegion::REGION_KEYS
    @user.update!(fulfillment_regions: regions)
    audit!("user.fulfillment_regions_updated", target: @user, metadata: { regions: regions })
    redirect_to admin_user_path(@user), notice: "Fulfillment regions updated."
  end

  def adjust_coins
    @user = User.find(params[:id])
    authorize @user, :show?

    amount = params[:amount].to_f
    reason = params[:reason].to_s.strip

    if amount.zero?
      redirect_to admin_user_path(@user), alert: "Amount must be non-zero."
      return
    end

    if reason.blank?
      redirect_to admin_user_path(@user), alert: "Provide a reason for the adjustment."
      return
    end

    @user.coin_adjustments.create!(actor: current_user, amount: amount, reason: reason)
    audit!("user.coins_adjusted", target: @user, metadata: { amount: amount, reason: reason, new_balance: @user.coin_balance })
    redirect_to admin_user_path(@user), notice: "Adjusted #{@user.display_name}'s balance by #{amount}c."
  end

  def add_note
    @user = User.find(params[:id])
    authorize @user, :show?
    note = @user.user_notes.create!(content: params[:content], author: current_user)
    audit!("user.note_added", target: @user, metadata: { note_id: note.id, content: note.content })
    redirect_to admin_user_path(@user), notice: "Note added."
  end

  def destroy_note
    @user = User.find(params[:id])
    authorize @user, :show?
    note = @user.user_notes.find(params[:note_id])
    audit!("user.note_destroyed", target: @user, metadata: { note_id: note.id, content: note.content })
    note.destroy
    redirect_to admin_user_path(@user), notice: "Note deleted."
  end

  def destroy
    @user = User.find(params[:id])
    authorize @user
    name = @user.display_name
    if @user.discarded?
      audit!("user.destroyed", target: @user, label: name)
      @user.destroy
      redirect_to admin_users_path, notice: "User '#{name}' has been permanently deleted."
    else
      @user.discard
      audit!("user.soft_deleted", target: @user)
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
    audit!("user.banned", target: @user, metadata: { reason: reason })
    redirect_to admin_user_path(@user), notice: "#{@user.display_name} has been banned."
  end

  def unban
    @user = User.find(params[:id])
    authorize @user, :destroy?
    previous_reason = @user.ban_reason
    @user.update!(is_banned: false, ban_reason: nil)
    audit!("user.unbanned", target: @user, metadata: { previous_reason: previous_reason })
    redirect_to admin_user_path(@user), notice: "#{@user.display_name} has been unbanned."
  end

  def restore
    @user = User.find(params[:id])
    authorize @user
    @user.undiscard
    audit!("user.restored", target: @user)
    redirect_to admin_user_path(@user), notice: "User '#{@user.display_name}' has been restored."
  end

  def update_roles
    @user = User.find(params[:id])
    authorize @user, :update?

    unless current_user.superadmin?
      redirect_to admin_user_path(@user), alert: "Only superadmins can change roles."
      return
    end

    new_roles = params[:roles].select(&:present?)
    added_roles = new_roles - @user.roles
    removed_roles = @user.roles - new_roles
    @user.roles = new_roles
    added_roles.each { |role| @user.apply_default_permissions_for_role(role) }
    @user.save!
    audit!("user.roles_updated", target: @user, metadata: { added: added_roles, removed: removed_roles, current: new_roles })
    redirect_to admin_user_path(@user), notice: "Roles updated."
  end

  def update_permissions
    @user = User.find(params[:id])
    authorize @user, :update?

    unless current_user.superadmin?
      redirect_to admin_user_path(@user), alert: "Only superadmins can change permissions."
      return
    end

    requested = Array(params[:permissions]).select(&:present?)
    added = requested - @user.permissions
    removed = @user.permissions - requested
    @user.update!(permissions: requested)
    audit!("user.permissions_updated", target: @user, metadata: { added: added, removed: removed, current: requested })
    redirect_to admin_user_path(@user), notice: "Permissions updated."
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
      shop_unlocked: user.shop_unlocked,
      maintenance_bypass: user.maintenance_bypass,
      referral_code: user.referral_code,
      fulfillment_regions: user.fulfillment_regions,
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

  def serialize_hackatime(info)
    {
      username: info["username"],
      trust_level: info["trust_level"],
      suspected: info["suspected"],
      banned: info["banned"],
      total_coding_time: info.dig("stats", "total_coding_time"),
      days_active: info.dig("stats", "days_active"),
      last_heartbeat_at: info["last_heartbeat_at"] ? Time.at(info["last_heartbeat_at"]).strftime("%b %d, %Y") : nil
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

  def serialize_kudo(kudo)
    {
      id: kudo.id,
      content: kudo.content,
      author_name: kudo.author.display_name,
      author_avatar: kudo.author.avatar,
      created_at: kudo.created_at.strftime("%b %d, %Y")
    }
  end

  def serialize_adjustment(adj)
    {
      id: adj.id,
      amount: adj.amount.to_f,
      reason: adj.reason,
      actor_name: adj.actor&.display_name || "System",
      created_at: adj.created_at.strftime("%b %d, %Y %H:%M")
    }
  end
end
