class Admin::ShipsController < Admin::ApplicationController
  before_action :require_pending_reviews_permission!
  before_action :set_ship, only: [ :show, :review, :skip ]

  def index
    pending = policy_scope(Ship)
      .includes(project: :user)
      .where(status: :pending)
      .order(created_at: :asc)

    all_scope = policy_scope(Ship)
      .includes(project: :user, reviewer: {})
      .order(created_at: :desc)

    @pagy, @all_ships = pagy(all_scope)

    render inertia: "Admin/Ships/Index", props: {
      pending_ships: pending.map { |s| serialize_ship_row(s) },
      all_ships: @all_ships.map { |s| serialize_ship_row(s) },
      pagy: pagy_props(@pagy),
      first_pending_id: pending.first&.id
    }
  end

  def show
    authorize @ship, :review?

    @project = @ship.project
    @devlogs = @project.devlogs.order(created_at: :asc)
    @notes = @project.project_notes.includes(:author).order(created_at: :desc)
    @sibling_ships = @project.ships.where.not(id: @ship.id).order(:created_at)

    next_id = policy_scope(Ship)
      .where(status: :pending)
      .where.not(id: @ship.id)
      .order(:created_at)
      .limit(1)
      .pluck(:id)
      .first

    render inertia: "Admin/Ships/Show", props: {
      ship: serialize_ship_detail(@ship),
      project: serialize_project_context(@project),
      devlogs: @devlogs.map { |d| serialize_devlog(d) },
      notes: @notes.map { |n| serialize_note(n) },
      siblings: @sibling_ships.map { |s| serialize_sibling(s) },
      next_pending_id: next_id,
      can: { review: policy(@ship).review? }
    }
  end

  def review
    authorize @ship, :review?

    decision = params[:decision].to_s

    case decision
    when "approve"
      handle_approve
    when "return"
      handle_return
    when "reject"
      handle_reject
    else
      redirect_to admin_ship_path(@ship), alert: "Invalid review decision."
    end
  end

  def skip
    authorize @ship, :review?

    next_id = policy_scope(Ship)
      .where(status: :pending)
      .where.not(id: @ship.id)
      .order(:created_at)
      .limit(1)
      .pluck(:id)
      .first

    if next_id
      redirect_to admin_ship_path(next_id)
    else
      redirect_to admin_ships_path, notice: "No more pending ships."
    end
  end

  private

  def require_pending_reviews_permission!
    require_permission!("pending_reviews")
  end

  def set_ship
    @ship = Ship.find(params[:id])
  end

  def handle_approve
    if @ship.approved?
      redirect_to admin_ship_path(@ship), alert: "Ship already approved."
      return
    end

    claimed_hours = @ship.project.total_hours.to_f
    approved_hours = params[:approved_hours].present? ? params[:approved_hours].to_f.clamp(0.0, claimed_hours) : claimed_hours

    reasoning = params[:reasoning].to_s.strip
    if reasoning.blank?
      redirect_to admin_ship_path(@ship), alert: "Reasoning is required when approving."
      return
    end

    justification = JustificationTemplate.render(
      ship: @ship,
      reviewer: current_user,
      claimed_hours: claimed_hours,
      approved_hours: approved_hours,
      review_justification: reasoning
    )

    @ship.update!(
      status: :approved,
      reviewer: current_user,
      approved_seconds: (approved_hours * 3600).round,
      justification: justification,
      feedback: params[:feedback].presence
    )

    audit!("ship.approved", target: @ship, metadata: { approved_hours: approved_hours, claimed_hours: claimed_hours })

    redirect_to admin_ships_path, notice: "Ship approved."
  end

  def handle_return
    feedback = params[:feedback].to_s.strip
    if feedback.blank?
      redirect_to admin_ship_path(@ship), alert: "Feedback is required when returning a ship."
      return
    end

    @ship.update!(
      status: :returned,
      reviewer: current_user,
      feedback: feedback
    )

    audit!("ship.returned", target: @ship, metadata: { feedback: feedback })

    redirect_to admin_ships_path, notice: "Ship returned to builder."
  end

  def handle_reject
    feedback = params[:feedback].to_s.strip
    if feedback.blank?
      redirect_to admin_ship_path(@ship), alert: "Feedback is required when rejecting a ship."
      return
    end

    @ship.update!(
      status: :rejected,
      reviewer: current_user,
      feedback: feedback
    )

    audit!("ship.rejected", target: @ship, metadata: { feedback: feedback })

    redirect_to admin_ships_path, notice: "Ship rejected."
  end

  def serialize_ship_row(ship)
    project = ship.project
    {
      id: ship.id,
      status: ship.status,
      project_id: project.id,
      project_name: project.name,
      user_id: project.user_id,
      user_display_name: project.user.display_name,
      user_avatar: project.user.avatar,
      reviewer_display_name: ship.reviewer&.display_name,
      approved_seconds: ship.approved_seconds,
      claimed_hours: project.total_hours.to_f.round(1),
      created_at: ship.created_at.strftime("%b %d, %Y"),
      created_at_iso: ship.created_at.iso8601
    }
  end

  def serialize_ship_detail(ship)
    {
      id: ship.id,
      status: ship.status,
      reviewer_display_name: ship.reviewer&.display_name,
      reviewer_email: ship.reviewer&.email,
      approved_seconds: ship.approved_seconds,
      feedback: ship.feedback,
      justification: ship.justification,
      frozen_demo_link: ship.frozen_demo_link,
      frozen_repo_link: ship.frozen_repo_link,
      frozen_screenshot: ship.frozen_screenshot,
      created_at: ship.created_at.strftime("%b %d, %Y %H:%M UTC"),
      created_at_iso: ship.created_at.iso8601
    }
  end

  def serialize_project_context(project)
    {
      id: project.id,
      name: project.name,
      subtitle: project.subtitle,
      description: project.description,
      status: project.status,
      tier: project.tier,
      tags: project.tags || [],
      repo_link: project.repo_link,
      cover_image_url: project.cover_image_url,
      user_id: project.user_id,
      user_display_name: project.user.display_name,
      user_avatar: project.user.avatar,
      user_email: project.user.email,
      total_hours: project.total_hours.to_f.round(1),
      devlog_hours: project.devlog_hours.to_f.round(1),
      override_hours: project.override_hours&.to_f,
      override_hours_justification: project.override_hours_justification,
      reviewed_at: project.reviewed_at&.strftime("%b %d, %Y %H:%M UTC"),
      reviewer_display_name: project.reviewer&.display_name,
      created_at: project.created_at.strftime("%b %d, %Y"),
      coin_rate: project.coin_rate
    }
  end

  def serialize_devlog(devlog)
    {
      id: devlog.id,
      title: devlog.title,
      content: devlog.content,
      time_spent: devlog.time_spent,
      time_hours: devlog.time_hours&.to_f,
      created_at: devlog.created_at.strftime("%b %d, %Y"),
      meets_requirements: devlog.meets_submission_requirements?
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

  def serialize_sibling(ship)
    {
      id: ship.id,
      status: ship.status,
      approved_seconds: ship.approved_seconds,
      reviewer_display_name: ship.reviewer&.display_name,
      created_at: ship.created_at.strftime("%b %d, %Y")
    }
  end
end
