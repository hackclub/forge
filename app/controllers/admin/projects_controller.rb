class Admin::ProjectsController < Admin::ApplicationController
  before_action :require_projects_permission!
  before_action :set_project, only: [ :show, :review, :destroy, :restore, :toggle_hidden, :toggle_staff_pick ]

  def index
    scope = policy_scope(Project).includes(:user, :ships)
    scope = params[:status] == "deleted" ? scope.discarded : scope.kept
    scope = scope.search(params[:query]) if params[:query].present?
    if params[:status] == "pending"
      scope = scope.where(status: [ :pending, :build_pending ])
    elsif params[:status].present? && params[:status] != "deleted"
      scope = scope.where(status: params[:status])
    end
    @pagy, @projects = pagy(scope.order(created_at: :desc))

    render inertia: "Admin/Projects/Index", props: {
      projects: @projects.map { |p| serialize_project_row(p) },
      pagy: pagy_props(@pagy),
      query: params[:query].to_s,
      status_filter: params[:status].to_s,
      counts: status_counts,
      page_title: "All Projects"
    }
  end

  def pitches
    scope = policy_scope(Project).includes(:user, :ships).kept.where(status: :pending)
    scope = scope.search(params[:query]) if params[:query].present?
    @pagy, @projects = pagy(scope.order(created_at: :desc))

    render inertia: "Admin/Projects/Index", props: {
      projects: @projects.map { |p| serialize_project_row(p) },
      pagy: pagy_props(@pagy),
      query: params[:query].to_s,
      status_filter: "pending",
      counts: status_counts,
      page_title: "Pitch Reviews",
      hide_filters: true
    }
  end

  def reviews
    scope = policy_scope(Project).includes(:user, :ships).kept.where(status: :build_pending)
    scope = scope.search(params[:query]) if params[:query].present?
    @pagy, @projects = pagy(scope.order(created_at: :desc))

    render inertia: "Admin/Projects/Index", props: {
      projects: @projects.map { |p| serialize_project_row(p) },
      pagy: pagy_props(@pagy),
      query: params[:query].to_s,
      status_filter: "build_pending",
      counts: status_counts,
      page_title: "Project Reviews",
      hide_filters: true
    }
  end

  def show
    authorize @project
    @ships = @project.ships.includes(:reviewer).order(created_at: :desc)

    render inertia: "Admin/Projects/Show", props: {
      project: serialize_project_detail(@project),
      ships: @ships.map { |s| serialize_ship_row(s) },
      can: { review: policy(@project).review?, destroy: policy(@project).destroy?, restore: policy(@project).restore? }
    }
  end

  def toggle_hidden
    authorize @project, :update?
    @project.update!(hidden: !@project.hidden)
    audit!("project.visibility_toggled", target: @project, metadata: { hidden: @project.hidden })
    status = @project.hidden? ? "hidden" : "visible"
    redirect_to admin_project_path(@project), notice: "Project is now #{status} on explore."
  end

  def toggle_staff_pick
    authorize @project, :update?
    @project.update!(staff_pick_at: @project.staff_pick? ? nil : Time.current)
    audit!("project.staff_pick_toggled", target: @project, metadata: { staff_pick: @project.staff_pick? })
    status = @project.staff_pick? ? "added to staff picks" : "removed from staff picks"
    redirect_to admin_project_path(@project), notice: "Project #{status}."
  end

  def restore
    authorize @project
    @project.undiscard
    audit!("project.restored", target: @project)
    redirect_to admin_project_path(@project), notice: "Project '#{@project.name}' has been restored."
  end

  def destroy
    authorize @project
    name = @project.name
    if @project.discarded?
      unless current_user.superadmin?
        redirect_to admin_project_path(@project), alert: "Only superadmins can permanently delete projects."
        return
      end

      audit!("project.destroyed", target: @project, label: name)
      @project.destroy
      redirect_to admin_projects_path, notice: "Project '#{name}' has been permanently deleted."
    else
      @project.discard
      audit!("project.soft_deleted", target: @project)
      redirect_to admin_projects_path, notice: "Project '#{name}' has been soft-deleted."
    end
  end

  def review
    authorize @project, :review?

    decision = params[:decision]
    feedback = params[:feedback]

    case decision
    when "approve"
      @project.update!(status: :approved, reviewer: current_user, reviewed_at: Time.current, review_feedback: feedback)
      audit!("project.approved", target: @project, metadata: { feedback: feedback })
      notify_slack_decision(@project, "approved", feedback)
      redirect_to admin_project_path(@project), notice: "Project approved."
    when "return"
      @project.update!(status: :returned, reviewer: current_user, reviewed_at: Time.current, review_feedback: feedback)
      audit!("project.returned", target: @project, metadata: { feedback: feedback })
      notify_slack_decision(@project, "returned for changes", feedback)
      redirect_to admin_project_path(@project), notice: "Project returned to builder."
    when "reject"
      @project.update!(status: :rejected, reviewer: current_user, reviewed_at: Time.current, review_feedback: feedback)
      audit!("project.rejected", target: @project, metadata: { feedback: feedback })
      notify_slack_decision(@project, "rejected", feedback)
      redirect_to admin_project_path(@project), notice: "Project rejected."
    when "draft"
      @project.update!(status: :draft, reviewer: current_user, reviewed_at: Time.current, review_feedback: feedback)
      audit!("project.reverted_to_draft", target: @project, metadata: { feedback: feedback })
      redirect_to admin_project_path(@project), notice: "Project reverted to draft."
    when "approve_build"
      capped = capped_override_hours(@project, params[:override_hours])
      @project.update!(
        status: :build_approved,
        reviewer: current_user,
        reviewed_at: Time.current,
        review_feedback: feedback,
        override_hours: capped,
        override_hours_justification: params[:override_hours_justification].presence
      )
      audit!("project.build_approved", target: @project, metadata: { feedback: feedback, override_hours: capped })
      ReferralEligibility.mark(@project)
      notify_slack_decision(@project, "build approved! :tada:", feedback)
      redirect_to admin_project_path(@project), notice: "Build approved."
    when "return_build"
      @project.update!(status: :approved, reviewer: current_user, reviewed_at: Time.current, review_feedback: feedback)
      audit!("project.build_returned", target: @project, metadata: { feedback: feedback })
      notify_slack_decision(@project, "build returned for more work", feedback)
      redirect_to admin_project_path(@project), notice: "Build returned to builder."
    when "reject_build"
      @project.update!(status: :rejected, reviewer: current_user, reviewed_at: Time.current, review_feedback: feedback)
      audit!("project.build_rejected", target: @project, metadata: { feedback: feedback })
      notify_slack_decision(@project, "build rejected", feedback)
      redirect_to admin_project_path(@project), notice: "Build rejected."
    when "save_review_notes"
      capped = capped_override_hours(@project, params[:override_hours])
      @project.update!(
        override_hours: capped,
        override_hours_justification: params[:override_hours_justification].presence
      )
      audit!("project.review_notes_saved", target: @project, metadata: { override_hours: capped })
      redirect_to admin_project_path(@project), notice: "Review notes saved."
    when "refresh_readme"
      FetchReadmeJob.perform_later(@project.id)
      audit!("project.readme_refreshed", target: @project)
      redirect_to admin_project_path(@project), notice: "Fetching latest README..."
    else
      redirect_to admin_project_path(@project), alert: "Invalid review decision."
    end
  end

  private

  def require_projects_permission!
    require_permission!("projects")
  end

  def capped_override_hours(project, raw)
    return nil if raw.blank?

    value = raw.to_f
    ceiling = project.devlog_hours
    value = ceiling if value > ceiling
    value
  end

  def notify_slack_decision(project, decision, feedback)
    return unless project.slack_channel_id.present? && project.slack_message_ts.present?

    emoji = case decision
    when "approved" then ":white_check_mark:"
    when "rejected" then ":x:"
    else ":arrows_counterclockwise:"
    end

    app_url = ENV.fetch("APP_URL", "https://forge.hackclub.com")
    project_url = "#{app_url}/projects/#{project.id}"

    reviewer_mention = current_user.slack_id.present? ? "<@#{current_user.slack_id}>" : current_user.display_name
    user_mention = project.user.slack_id.present? ? "<@#{project.user.slack_id}>" : project.user.display_name
    msg = "#{emoji} #{user_mention} Your pitch for *#{project.name}* has been *#{decision}* by #{reviewer_mention}."
    msg += "\n\n*Reviewer feedback:*\n> #{feedback}" if feedback.present?

    if decision.include?("returned")
      msg += "\n\n:pencil2: *Edit your original pitch message above* with the requested changes, then open your project and click *Resubmit Pitch*."
      msg += "\n\n:point_right: <#{project_url}|Open Project>"
    else
      msg += "\n\n<#{project_url}|View Project>"
    end

    reaction = case decision
    when "approved", /build approved/ then "yay"
    when "rejected" then "x"
    else "clock1"
    end

    SlackNotifyJob.perform_later(
      channel_id: project.slack_channel_id,
      thread_ts: project.slack_message_ts,
      text: msg,
      reaction: reaction
    )
  end

  def status_counts
    kept_scope = policy_scope(Project).kept
    raw = kept_scope.group(:status).count
    pending_count = (raw["pending"] || 0) + (raw["build_pending"] || 0)
    {
      all: raw.values.sum,
      pending: pending_count,
      approved: raw["approved"] || 0,
      returned: raw["returned"] || 0,
      rejected: raw["rejected"] || 0,
      draft: raw["draft"] || 0,
      build_approved: raw["build_approved"] || 0,
      deleted: policy_scope(Project).discarded.count
    }
  end

  def set_project
    @project = Project.find(params[:id])
  end

  def serialize_project_row(project)
    {
      id: project.id,
      name: project.name,
      status: project.status,
      user_id: project.user_id,
      user_display_name: project.user.display_name,
      ships_count: project.ships.size,
      is_discarded: project.discarded?,
      created_at: project.created_at.strftime("%b %d, %Y")
    }
  end

  def serialize_project_detail(project)
    {
      id: project.id,
      name: project.name,
      subtitle: project.subtitle,
      description: project.description,
      red_flags: project.red_flags || [],
      green_flags: project.green_flags || [],
      repo_link: project.repo_link,
      tags: project.tags,
      status: project.status,
      review_feedback: project.review_feedback,
      reviewed_at: project.reviewed_at&.strftime("%b %d, %Y"),
      reviewer_display_name: project.reviewer&.display_name,
      is_discarded: project.discarded?,
      discarded_at: project.discarded_at&.strftime("%b %d, %Y"),
      pitch_text: project.pitch_text,
      from_slack: project.slack_message_ts.present?,
      slack_url: project.slack_channel_id.present? && project.slack_message_ts.present? ? "https://hackclub.slack.com/archives/#{project.slack_channel_id}/p#{project.slack_message_ts.to_s.delete('.')}" : nil,
      tier: project.tier,
      budget: project.budget,
      cover_image_url: project.cover_image_url,
      override_hours: project.override_hours&.to_f,
      override_hours_justification: project.override_hours_justification,
      readme_cache: project.readme_cache,
      readme_fetched_at: project.readme_fetched_at&.strftime("%b %d, %Y %H:%M"),
      total_hours: project.total_hours,
      devlog_hours: project.devlog_hours,
      devlogs: project.devlogs.order(created_at: :desc).map { |d| serialize_devlog(d) },
      hidden: project.hidden,
      staff_pick: project.staff_pick?,
      user_id: project.user_id,
      user_display_name: project.user.display_name,
      user_email: project.user.email,
      user_has_address: project.user.address_line1.present?,
      created_at: project.created_at.strftime("%b %d, %Y")
    }
  end

  def serialize_devlog(devlog)
    {
      id: devlog.id,
      title: devlog.title,
      content: devlog.content,
      time_spent: devlog.time_spent,
      created_at: devlog.created_at.strftime("%b %d, %Y")
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
