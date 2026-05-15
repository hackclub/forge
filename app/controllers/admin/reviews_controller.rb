class Admin::ReviewsController < Admin::ApplicationController
  before_action :require_pending_reviews_permission!
  before_action :set_project, only: [ :show, :skip, :track ]

  TRACKABLE_BUTTONS = %w[
    end_session skip next_project view_project
    open_user open_repo open_public
    refresh_readme change_tier ai_check_run
    approve_clicked return_clicked draft_clicked reject_open reject_cancel reject_confirm
    open_devlog toggle_readme
  ].freeze

  def show
    authorize @project, :review?

    @session = ensure_session(@project) if @project.pending?
    concurrent = concurrent_active_reviewers(@project)

    next_pending_id = policy_scope(Project)
      .kept
      .where(status: :pending)
      .where.not(id: @project.id)
      .order(created_at: :asc)
      .limit(1)
      .pluck(:id)
      .first

    render inertia: "Admin/Reviews/Show", props: {
      project: serialize_project_for_review(@project),
      review_history: @project.review_history.map { |e| serialize_review_event(e) },
      notes: @project.project_notes.includes(:author).order(created_at: :desc).map { |n| serialize_note(n) },
      session: @session ? serialize_session(@session) : nil,
      concurrent_reviewers: concurrent,
      next_pending_id: next_pending_id,
      reviewer: {
        display_name: current_user.display_name,
        email: current_user.email,
        is_superadmin: current_user.superadmin?,
        slack_id: current_user.slack_id
      },
      can: { review: policy(@project).review? },
      session_stats: current_user.superadmin? ? session_stats(@project) : nil,
      checkpoint_channel_configured: ENV["FORGE_CHECKPOINT_CHANNEL_ID"].to_s.strip.present?
    }
  end

  def skip
    authorize @project, :review?

    next_id = policy_scope(Project)
      .kept
      .where(status: :pending)
      .where.not(id: @project.id)
      .order(created_at: :asc)
      .limit(1)
      .pluck(:id)
      .first

    if next_id
      redirect_to admin_review_path(next_id)
    else
      redirect_to admin_reviews_path, notice: "No more pending projects."
    end
  end

  def track
    authorize @project, :review?

    button = params[:button].to_s
    unless TRACKABLE_BUTTONS.include?(button)
      head :unprocessable_entity
      return
    end

    extras = params[:metadata].respond_to?(:to_unsafe_h) ? params[:metadata].to_unsafe_h : {}
    safe_extras = extras.first(8).to_h { |k, v| [ k.to_s, v.is_a?(String) ? v.truncate(200) : v ] }
    audit!("review.button_clicked", target: @project, metadata: { button: button }.merge(safe_extras))
    head :no_content
  end

  private

  def require_pending_reviews_permission!
    require_permission!("pending_reviews")
  end

  def set_project
    @project = Project.find(params[:id])
  end

  def ensure_session(project)
    ReviewSession.active.for_reviewer(current_user).for_project(project).first ||
      ReviewSession.create!(
        project: project,
        reviewer: current_user,
        started_at: Time.current,
        last_heartbeat_at: Time.current
      )
  end

  def concurrent_active_reviewers(project)
    cutoff = 10.minutes.ago
    ReviewSession.active
      .for_project(project)
      .where.not(reviewer_id: current_user.id)
      .where("last_heartbeat_at >= ?", cutoff)
      .includes(:reviewer)
      .map do |s|
        {
          reviewer_name: s.reviewer.display_name,
          reviewer_avatar: s.reviewer.avatar,
          started_at: s.started_at.strftime("%H:%M UTC"),
          last_heartbeat_at: s.last_heartbeat_at&.strftime("%H:%M UTC")
        }
      end
  end

  def session_stats(project)
    sessions = ReviewSession.for_project(project).includes(:reviewer)
    {
      sessions: sessions.map do |s|
        {
          id: s.id,
          reviewer_name: s.reviewer.display_name,
          active_seconds: s.active_seconds,
          started_at: s.started_at.strftime("%b %d, %Y %H:%M UTC"),
          ended_at: s.ended_at&.strftime("%b %d, %Y %H:%M UTC"),
          decision: s.decision
        }
      end,
      total_active_seconds: sessions.sum(:active_seconds)
    }
  end

  def serialize_session(session)
    {
      id: session.id,
      active_seconds: session.active_seconds,
      started_at: session.started_at.iso8601,
      heartbeat_path: heartbeat_admin_review_session_path(session)
    }
  end

  def serialize_project_for_review(project)
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
      tier: project.tier,
      budget: project.budget,
      coin_rate: project.coin_rate,
      total_hours: project.total_hours.to_f.round(1),
      devlog_hours: project.devlog_hours.to_f.round(1),
      override_hours: project.override_hours&.to_f,
      override_hours_justification: project.override_hours_justification,
      cover_image_url: project.cover_image_url,
      pitch_text: project.pitch_text,
      readme_cache: project.readme_cache,
      readme_fetched_at: project.readme_fetched_at&.strftime("%b %d, %Y %H:%M"),
      reviewed_at: project.reviewed_at&.strftime("%b %d, %Y %H:%M UTC"),
      reviewer_display_name: project.reviewer&.display_name,
      review_feedback: project.review_feedback,
      ai_check_result: project.ai_check_result,
      ai_check_ran_at: project.ai_check_ran_at&.strftime("%b %d, %Y %H:%M UTC"),
      from_slack: project.slack_message_ts.present?,
      slack_url: project.slack_channel_id.present? && project.slack_message_ts.present? ? "https://hackclub.slack.com/archives/#{project.slack_channel_id}/p#{project.slack_message_ts.to_s.delete('.')}" : nil,
      created_at: project.created_at.strftime("%b %d, %Y"),
      created_at_iso: project.created_at.iso8601,
      user_id: project.user_id,
      user_display_name: project.user.display_name,
      user_email: project.user.email,
      user_avatar: project.user.avatar,
      user_slack_id: project.user.slack_id,
      coins_earned_preview: project.coin_rate.to_f * project.total_hours.to_f,
      devlogs: project.devlogs.order(created_at: :asc).map { |d| serialize_devlog(d) }
    }
  end

  def serialize_devlog(devlog)
    details = devlog.requirement_validation_details
    {
      id: devlog.id,
      title: devlog.title,
      content: devlog.content,
      time_spent: devlog.time_spent,
      time_hours: devlog.time_hours&.to_f,
      created_at: devlog.created_at.strftime("%b %d, %Y"),
      meets_requirements: devlog.meets_submission_requirements?,
      validation: {
        content_length: details[:content_length],
        has_image: details[:has_image]
      }
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

  def serialize_review_event(event)
    meta = event.metadata || {}
    {
      id: event.id,
      action: event.action,
      stage: meta["stage"],
      feedback: meta["feedback"].presence || meta["reason"].presence,
      reviewer_display_name: event.actor&.display_name,
      reviewer_avatar: event.actor&.avatar,
      target_type: event.target_type,
      target_label: event.target_label,
      created_at: event.created_at.strftime("%b %d, %Y %H:%M")
    }
  end
end
