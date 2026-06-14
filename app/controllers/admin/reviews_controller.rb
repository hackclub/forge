class Admin::ReviewsController < Admin::ApplicationController
  before_action :require_pending_reviews_permission!
  before_action :set_project, only: [ :show, :skip, :track, :claim ]

  TRACKABLE_BUTTONS = %w[
    end_session skip next_project view_project
    open_user open_repo open_public
    refresh_readme change_tier ai_check_run
    approve_clicked return_clicked draft_clicked reject_open reject_cancel reject_confirm
    open_devlog toggle_readme
  ].freeze

  def index
    base = policy_scope(Project).kept.where(status: :pending)
    queue = base.not_flagged_for_review

    scope =
      case params[:filter]
      when "flagged" then base.flagged_for_review
      when "design" then queue.where(build_review: false)
      when "build" then queue.where(build_review: true)
      else queue
      end
    scope = scope.includes(:user)
    scope = scope.search(params[:query]) if params[:query].present?

    @pagy, @projects = pagy(scope.order(Arel.sql("COALESCE(submitted_at, created_at) ASC")))

    claims = ReviewSession.active.fresh
      .where(project_id: @projects.map(&:id))
      .includes(:reviewer)
      .group_by(&:project_id)

    render inertia: "Admin/Reviews/Queue", props: {
      projects: @projects.map { |p| serialize_review_queue_row(p, claims[p.id]) },
      pagy: pagy_props(@pagy),
      query: params[:query].to_s,
      filter: params[:filter].to_s,
      metrics: ReviewQueueMetrics.new(queue).as_json,
      first_pending_id: @projects.first&.id
    }
  end

  def show
    authorize @project, :review?

    @session = ensure_session(@project) if @project.pending?
    concurrent = concurrent_active_reviewers(@project)
    claim = claim_state(@project)

    next_pending_id = policy_scope(Project)
      .kept
      .where(status: :pending)
      .not_flagged_for_review
      .where.not(id: @project.id)
      .order(Arel.sql("COALESCE(submitted_at, created_at) ASC"))
      .limit(1)
      .pluck(:id)
      .first

    render inertia: "Admin/Reviews/Show", props: {
      project: serialize_project_for_review(@project),
      review_history: @project.admin_review_history.map { |e| serialize_review_event(e) },
      notes: @project.project_notes.includes(:author).order(created_at: :desc).map { |n| serialize_note(n) },
      session: @session ? serialize_session(@session) : nil,
      concurrent_reviewers: concurrent,
      next_pending_id: next_pending_id,
      reviewer: {
        id: current_user.id,
        display_name: current_user.display_name,
        email: current_user.email,
        is_superadmin: current_user.superadmin?,
        slack_id: current_user.slack_id
      },
      can: { review: policy(@project).review?, claim: claim[:locked_by].nil? || current_user.superadmin? },
      claim: claim,
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
      .order(Arel.sql("COALESCE(submitted_at, created_at) ASC"))
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

  def claim
    authorize @project, :review?

    holder = ReviewSession.active.for_project(@project).fresh
      .where.not(reviewer_id: current_user.id)
      .order(:started_at)
      .includes(:reviewer)
      .first

    if holder && !current_user.superadmin?
      redirect_to admin_review_path(@project),
        alert: "#{holder.reviewer.display_name} is actively reviewing this — coordinate before taking over."
      return
    end

    ReviewSession.active.for_project(@project).where.not(reviewer_id: current_user.id).find_each do |s|
      previous_reviewer_id = s.reviewer_id
      s.end!(decision: nil)
      audit!("review.claim_taken_over", target: @project, metadata: { from_reviewer_id: previous_reviewer_id })
    end
    ensure_session(@project)

    redirect_to admin_review_path(@project), notice: "You've taken over this review."
  end

  private

  def claim_state(project)
    holder = ReviewSession.active.for_project(project).fresh
      .includes(:reviewer)
      .order(:started_at)
      .first

    if holder.nil? || holder.reviewer_id == current_user.id
      { locked_by: nil, can_take_over: false }
    else
      {
        locked_by: {
          name: holder.reviewer.display_name,
          avatar: holder.reviewer.avatar,
          since: holder.started_at.iso8601
        },
        can_take_over: current_user.superadmin?
      }
    end
  end

  def serialize_review_queue_row(project, sessions)
    holder = sessions&.min_by(&:started_at)
    {
      id: project.id,
      name: project.name,
      user_id: project.user_id,
      user_display_name: project.user.display_name,
      tier: project.tier,
      is_build_review: project.build_review,
      waiting_since_iso: (project.submitted_at || project.created_at).iso8601,
      claimed_by: holder ? { name: holder.reviewer.display_name, avatar: holder.reviewer.avatar } : nil,
      flagged: project.flagged_for_review?,
      flag_reason: project.flag_reason
    }
  end

  def require_pending_reviews_permission!
    require_permission!("pending_reviews")
  end

  def set_project
    @project = Project.includes(:user, :linked_project, :build_review_for_project, :ships).find(params[:id])
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
      commits_url: commits_url_for(project.repo_link),
      devlog_mode: project.devlog_mode,
      uses_ai: project.uses_ai,
      ai_usage: project.ai_usage,
      git_journal_url: git_journal_url_for(project),
      build_proof_url: project.build_proof_url,
      submission_requirements: SubmissionRequirements.for_project(project),
      tags: project.tags,
      status: project.status,
      tier: project.tier,
      budget: project.budget,
      build_review: project.build_review,
      linked_project: project.linked_project ? { id: project.linked_project.id, name: project.linked_project.name } : nil,
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
      ai_check_result: project.ai_check_result_for_display,
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
      coins_earned_preview: project.group_project? ? ProjectPayoutCalculator.new(project).total : project.coin_rate.to_f * project.total_hours.to_f,
      is_group_project: project.group_project?,
      members: serialize_members_for_review(project),
      devlogs: project.devlogs.includes(:user).order(created_at: :asc).map { |d| serialize_devlog(d) },
      sibling: sibling_review_summary(project),
      ships: project.ships.sort_by(&:created_at).reverse.map { |s| serialize_ship(s) },
      flagged_for_review: project.flagged_for_review?,
      flag_reason: project.flag_reason,
      flagged_by_name: project.flagged_by&.display_name
    }
  end

  def sibling_review_summary(project)
    sibling = project.build_review? ? project.linked_project : project.build_review_for_project
    return nil unless sibling

    {
      id: sibling.id,
      kind: project.build_review? ? "design" : "build",
      name: sibling.name,
      status: sibling.status,
      pending: sibling.pending?,
      reviewed_at: sibling.reviewed_at&.strftime("%b %d, %Y"),
      reviewer_name: sibling.reviewer&.display_name
    }
  end

  def serialize_ship(ship)
    {
      id: ship.id,
      status: ship.status,
      demo_link: ship.frozen_demo_link,
      repo_link: ship.frozen_repo_link,
      created_at: ship.created_at.strftime("%b %d, %Y")
    }
  end

  # Per-member hour attribution + projected coin shares (reflects any saved
  # override_hours). Only meaningful for group projects but harmless for solo.
  def serialize_members_for_review(project)
    shares = ProjectPayoutCalculator.new(project).shares.index_by { |s| s.user.id }
    project.members.map do |member|
      share = shares[member.id]
      {
        user_id: member.id,
        display_name: member.display_name,
        avatar: member.avatar,
        slack_id: member.slack_id,
        is_owner: member.id == project.user_id,
        devlog_hours: project.devlogs.select { |d| d.user_id == member.id }.sum(&:parsed_hours).to_f.round(1),
        approved_hours: share&.hours,
        projected_coins: share&.coins,
        streak_multiplier: share&.streak_multiplier,
        guild_multiplier: share&.guild_multiplier
      }
    end
  end

  def commits_url_for(repo_link)
    return nil if repo_link.blank?

    if (m = repo_link.match(%r{github\.com/([^/]+)/([^/?#]+?)(?:\.git)?/?\z}))
      "https://github.com/#{m[1]}/#{m[2]}/commits"
    elsif (m = repo_link.match(%r{gitlab\.com/([^?#]+?)(?:\.git)?/?\z}))
      "https://gitlab.com/#{m[1]}/-/commits"
    end
  end

  def git_journal_url_for(project)
    link = project.repo_link.to_s
    return nil if link.blank?

    branch = project.journal_branch.presence || "main"
    if (m = link.match(%r{github\.com/([^/]+)/([^/]+?)(?:\.git)?(?:/|$)}))
      "https://github.com/#{m[1]}/#{m[2]}/blob/#{branch}/JOURNAL.md"
    elsif (m = link.match(%r{gitlab\.com/([^/]+)/([^/]+?)(?:\.git)?(?:/|$)}))
      "https://gitlab.com/#{m[1]}/#{m[2]}/-/blob/#{branch}/JOURNAL.md"
    elsif (m = link.match(%r{codeberg\.org/([^/]+)/([^/]+?)(?:\.git)?(?:/|$)}))
      "https://codeberg.org/#{m[1]}/#{m[2]}/src/branch/#{branch}/JOURNAL.md"
    end
  end

  def serialize_devlog(devlog)
    details = devlog.requirement_validation_details
    {
      id: devlog.id,
      title: devlog.title,
      content: devlog.content,
      time_spent: devlog.time_spent,
      time_hours: devlog.time_hours&.to_f,
      lapse_url: devlog.lapse_url,
      created_at: devlog.created_at.strftime("%b %d, %Y"),
      user_id: devlog.user_id,
      user_display_name: devlog.user.display_name,
      user_avatar: devlog.user.avatar,
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
      author_id: note.author_id,
      author_name: note.author.display_name,
      author_avatar: note.author.avatar,
      edited: note.updated_at > note.created_at + 1.second,
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
      internal_justification: meta["justification"].presence || meta["reasoning"].presence,
      old_tier: meta["old_tier"],
      new_tier: meta["new_tier"],
      approved_hours: meta["approved_hours"],
      override_hours: meta["override_hours"],
      coins_awarded: meta["coins_awarded"],
      refunded_coins: meta["refunded"] ? meta["previous_coins_earned"] : nil,
      member_breakdown: meta["member_breakdown"],
      reviewer_display_name: event.actor&.display_name,
      reviewer_avatar: event.actor&.avatar,
      target_type: event.target_type,
      target_label: event.target_label,
      created_at: event.created_at.strftime("%b %d, %Y %H:%M")
    }
  end
end
