class Admin::ReviewAuditsController < Admin::ApplicationController
  REVIEWER_HOURLY_USD = 10.0
  REVIEWER_PER_REVIEW_USD = 0.33

  before_action :require_superadmin!
  before_action :set_session, only: [ :show ]

  def index
    scope = ReviewSession.completed.includes(:reviewer, :project).order(ended_at: :desc)
    scope = scope.where(reviewer_id: params[:reviewer_id]) if params[:reviewer_id].present?
    scope = scope.where(project_id: params[:project_id]) if params[:project_id].present?

    @pagy, @sessions = pagy(scope)

    render inertia: "Admin/ReviewAudits/Index", props: {
      sessions: @sessions.map { |s| serialize_session_row(s) },
      pagy: pagy_props(@pagy),
      filters: {
        reviewer_id: params[:reviewer_id].to_s,
        project_id: params[:project_id].to_s
      },
      totals: aggregate_totals
    }
  end

  def show
    audit_events = AuditEvent
      .includes(:actor)
      .where(actor_id: @session.reviewer_id)
      .where("(target_type = 'Project' AND target_id = ?) OR (metadata @> ?::jsonb)", @session.project_id, { project_id: @session.project_id }.to_json)
      .where(created_at: window_for(@session))
      .order(created_at: :asc)

    render inertia: "Admin/ReviewAudits/Show", props: {
      session: serialize_session_detail(@session),
      events: audit_events.map { |e| serialize_event(e) }
    }
  end

  private

  def require_superadmin!
    raise ActionController::RoutingError, "Not Found" unless current_user&.superadmin?
  end

  def set_session
    @session = ReviewSession.find(params[:id])
  end

  def window_for(session)
    finish = session.ended_at || (session.last_heartbeat_at || session.started_at) + 5.minutes
    (session.started_at)..finish
  end

  def aggregate_totals
    base = ReviewSession.completed
    by_active = base.group(:reviewer_id).sum(:active_seconds)
    counts = base.group(:reviewer_id).count

    wall_by_id = Hash.new(0)
    base.pluck(:reviewer_id, :started_at, :ended_at, :last_heartbeat_at).each do |rid, started_at, ended_at, last_hb|
      finish = ended_at || last_hb || Time.current
      wall_by_id[rid] += (finish - started_at).to_i
    end

    reviewer_ids = (by_active.keys | wall_by_id.keys)
    names = User.where(id: reviewer_ids).pluck(:id, :display_name).to_h

    reviewer_ids.map do |id|
      active_seconds = by_active[id] || 0
      reviews_count = counts[id] || 0
      hourly_estimate = (active_seconds / 3600.0) * REVIEWER_HOURLY_USD
      per_review_estimate = reviews_count * REVIEWER_PER_REVIEW_USD

      {
        reviewer_id: id,
        reviewer_name: names[id] || "Unknown",
        active_seconds: active_seconds,
        wall_seconds: wall_by_id[id] || 0,
        reviews_count: reviews_count,
        hourly_estimate_usd: hourly_estimate.round(2),
        per_review_estimate_usd: per_review_estimate.round(2),
        estimated_payment_usd: ((hourly_estimate + per_review_estimate) / 2.0).round(2)
      }
    end
  end

  def serialize_session_row(session)
    {
      id: session.id,
      reviewer_id: session.reviewer_id,
      reviewer_name: session.reviewer.display_name,
      project_id: session.project_id,
      project_name: session.project.name,
      started_at: session.started_at.strftime("%b %d, %Y %H:%M UTC"),
      ended_at: session.ended_at&.strftime("%b %d, %Y %H:%M UTC"),
      active_seconds: session.active_seconds,
      decision: session.decision
    }
  end

  def serialize_session_detail(session)
    {
      id: session.id,
      reviewer: {
        id: session.reviewer_id,
        name: session.reviewer.display_name,
        email: session.reviewer.email,
        avatar: session.reviewer.avatar
      },
      project: {
        id: session.project_id,
        name: session.project.name,
        status: session.project.status
      },
      started_at: session.started_at.strftime("%b %d, %Y %H:%M:%S UTC"),
      ended_at: session.ended_at&.strftime("%b %d, %Y %H:%M:%S UTC"),
      last_heartbeat_at: session.last_heartbeat_at&.strftime("%b %d, %Y %H:%M:%S UTC"),
      active_seconds: session.active_seconds,
      heartbeats_count: session.heartbeats_count,
      decision: session.decision,
      wall_clock_seconds: ((session.ended_at || Time.current) - session.started_at).to_i
    }
  end

  def serialize_event(event)
    {
      id: event.id,
      action: event.action,
      metadata: event.metadata,
      target_type: event.target_type,
      target_id: event.target_id,
      target_label: event.target_label,
      created_at: event.created_at.strftime("%H:%M:%S UTC"),
      created_at_iso: event.created_at.iso8601
    }
  end
end
