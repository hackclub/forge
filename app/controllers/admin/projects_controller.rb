class Admin::ProjectsController < Admin::ApplicationController
  before_action :require_admin!, only: [ :index ]
  before_action :set_project, only: [ :show, :review, :destroy, :restore ]

  def index
    scope = policy_scope(Project).includes(:user, :ships)
    scope = scope.search(params[:query]) if params[:query].present?
    scope = scope.where(status: params[:status]) if params[:status].present?
    @pagy, @projects = pagy(scope.order(created_at: :desc))

    render inertia: "Admin/Projects/Index", props: {
      projects: @projects.map { |p| serialize_project_row(p) },
      pagy: pagy_props(@pagy),
      query: params[:query].to_s,
      status_filter: params[:status].to_s,
      counts: {
        all: policy_scope(Project).count,
        pending: policy_scope(Project).pending.count,
        approved: policy_scope(Project).approved.count,
        returned: policy_scope(Project).returned.count,
        rejected: policy_scope(Project).rejected.count,
        draft: policy_scope(Project).draft.count
      }
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

    msg = "#{emoji} Your pitch for *#{project.name}* has been *#{decision}*."
    msg += "\n\n *Here's what our reviewers had to say:* \n> #{feedback}" if feedback.present?

    SlackNotifyJob.perform_later(
      channel_id: project.slack_channel_id,
      thread_ts: project.slack_message_ts,
      text: msg
    )
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
      from_slack: project.slack_message_ts.present?,
      user_id: project.user_id,
      user_display_name: project.user.display_name,
      created_at: project.created_at.strftime("%b %d, %Y")
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
