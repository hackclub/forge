class Admin::ProjectsController < Admin::ApplicationController
  before_action :require_admin!, only: [ :index ]
  before_action :set_project, only: [ :show, :review, :destroy, :restore ]

  def index
    scope = policy_scope(Project).includes(:user, :ships)
    scope = scope.search(params[:query]) if params[:query].present?
    if params[:status] == "pending"
      scope = scope.where(status: [ :pending, :build_pending ])
    elsif params[:status].present?
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
    scope = policy_scope(Project).includes(:user, :ships).where(status: :pending)
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
    scope = policy_scope(Project).includes(:user, :ships).where(status: :build_pending)
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

  def restore
    authorize @project
    @project.undiscard
    redirect_to admin_project_path(@project), notice: "Project '#{@project.name}' has been restored."
  end

  def destroy
    authorize @project
    name = @project.name
    if @project.discarded?
      @project.destroy
      redirect_to admin_projects_path, notice: "Project '#{name}' has been permanently deleted."
    else
      @project.discard
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
      notify_slack_decision(@project, "approved", feedback)
      redirect_to admin_project_path(@project), notice: "Project approved."
    when "return"
      @project.update!(status: :returned, reviewer: current_user, reviewed_at: Time.current, review_feedback: feedback)
      notify_slack_decision(@project, "returned for changes", feedback)
      redirect_to admin_project_path(@project), notice: "Project returned to builder."
    when "reject"
      @project.update!(status: :rejected, reviewer: current_user, reviewed_at: Time.current, review_feedback: feedback)
      notify_slack_decision(@project, "rejected", feedback)
      redirect_to admin_project_path(@project), notice: "Project rejected."
    when "draft"
      @project.update!(status: :draft, reviewer: current_user, reviewed_at: Time.current, review_feedback: feedback)
      redirect_to admin_project_path(@project), notice: "Project reverted to draft."
    when "approve_build"
      hcb_link = params[:hcb_grant_link].to_s.strip
      @project.update!(
        status: :build_approved,
        reviewer: current_user,
        reviewed_at: Time.current,
        review_feedback: feedback,
        hcb_grant_link: hcb_link.presence,
        override_hours: params[:override_hours].presence,
        override_hours_justification: params[:override_hours_justification].presence
      )
      notify_slack_decision(@project, "build approved! :tada:", feedback)
      redirect_to admin_project_path(@project), notice: "Build approved."
    when "return_build"
      @project.update!(status: :approved, reviewer: current_user, reviewed_at: Time.current, review_feedback: feedback)
      notify_slack_decision(@project, "build returned for more work", feedback)
      redirect_to admin_project_path(@project), notice: "Build returned to builder."
    when "reject_build"
      @project.update!(status: :rejected, reviewer: current_user, reviewed_at: Time.current, review_feedback: feedback)
      notify_slack_decision(@project, "build rejected", feedback)
      redirect_to admin_project_path(@project), notice: "Build rejected."
    when "save_review_notes"
      @project.update!(
        override_hours: params[:override_hours].presence,
        override_hours_justification: params[:override_hours_justification].presence,
        hcb_grant_link: params[:hcb_grant_link].presence
      )
      redirect_to admin_project_path(@project), notice: "Review notes saved."
    when "refresh_readme"
      FetchReadmeJob.perform_later(@project.id)
      redirect_to admin_project_path(@project), notice: "Fetching latest README..."
    else
      redirect_to admin_project_path(@project), alert: "Invalid review decision."
    end
  end

  private

  def notify_slack_decision(project, decision, feedback)
    return unless project.slack_channel_id.present? && project.slack_message_ts.present?

    emoji = case decision
    when "approved" then ":white_check_mark:"
    when "rejected" then ":x:"
    else ":arrows_counterclockwise:"
    end

    app_url = ENV.fetch("APP_URL", "https://forge.hackclub.com")
    project_url = "#{app_url}/projects/#{project.id}"

    msg = "#{emoji} Your pitch for *#{project.name}* has been *#{decision}*."
    msg += "\n\n*Reviewer feedback:*\n> #{feedback}" if feedback.present?

    if decision.include?("returned")
      resubmit_url = "#{app_url}/projects/#{project.id}/resubmit_pitch"
      msg += "\n\n:pencil2: *Edit your original pitch message above* with the requested changes, then click the link below to resubmit."
      msg += "\n\n:point_right: <#{resubmit_url}|Resubmit Pitch>"
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
    raw = policy_scope(Project).group(:status).count
    pending_count = (raw["pending"] || 0) + (raw["build_pending"] || 0)
    {
      all: raw.values.sum,
      pending: pending_count,
      approved: raw["approved"] || 0,
      returned: raw["returned"] || 0,
      rejected: raw["rejected"] || 0,
      draft: raw["draft"] || 0,
      build_approved: raw["build_approved"] || 0
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
      repo_link: project.repo_link,
      tags: project.tags,
      status: project.status,
      review_feedback: project.review_feedback,
      reviewed_at: project.reviewed_at&.strftime("%b %d, %Y"),
      reviewer_display_name: project.reviewer&.display_name,
      is_discarded: project.discarded?,
      discarded_at: project.discarded_at&.strftime("%b %d, %Y"),
      pitch_text: project.pitch_text,
      hcb_grant_link: project.hcb_grant_link,
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
      devlogs: project.devlogs.order(created_at: :desc).map { |d| serialize_devlog(d) },
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
