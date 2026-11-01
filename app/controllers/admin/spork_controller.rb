class Admin::SporkController < Admin::ApplicationController
  include SporkProps

  FILTERS = %w[queue checking hits exclusive innocent failed unscreened all].freeze
  VERDICT_ORDER_SQL = Arel.sql(<<~SQL.squish)
    CASE spork_checks.verdict
      WHEN 'exclusive_match' THEN 0
      WHEN 'shared_template' THEN 1
      WHEN 'failed' THEN 2
      ELSE 3
    END
  SQL

  before_action :require_fraud_permission!

  def index
    query = params[:query].to_s.strip
    filter = FILTERS.include?(params[:filter]) ? params[:filter] : (query.present? ? "all" : "queue")

    scope = policy_scope(Project).kept.joins(:user).where(users: { is_banned: false }).left_joins(:spork_check).preload(:user, spork_check: [ :innocent_by, :checking_by ])
    scope = filter_scope(scope, filter)
    scope = search_scope(scope, query) if query.present?
    @pagy, projects = pagy(scope.reorder(VERDICT_ORDER_SQL, Arel.sql("spork_checks.match_count DESC NULLS LAST"), "projects.created_at DESC"))

    render inertia: "Admin/Spork/Index", props: {
      projects: projects.map { |p| serialize_row(p) },
      pagy: pagy_props(@pagy),
      query: query,
      filter: filter,
      stats: stats,
      enabled: SporkService.enabled?
    }
  end

  def sweep
    SporkSweepJob.perform_later
    audit!("spork.sweep_triggered", target: nil)
    redirect_to admin_spork_path, notice: "Spork sweep queued. Results fill in as each project is screened."
  end

  def screen
    project = policy_scope(Project).kept.find(params[:project_id])
    SporkScreenJob.perform_later(project.id)
    audit!("spork.screen_triggered", target: project)
    redirect_back_or_to admin_spork_path, notice: "Spork screen queued for #{project.name}."
  end

  def innocent
    project = policy_scope(Project).kept.find(params[:project_id])
    check = project.spork_check
    return redirect_back_or_to admin_spork_path, alert: "#{project.name} has not been screened yet." unless check

    note = params[:note].to_s.strip.presence
    check.update!(innocent_at: Time.current, innocent_by: current_user, innocent_note: note, checking_at: nil, checking_by: nil)
    audit!("spork.marked_innocent", target: project, metadata: { note: note })
    redirect_back_or_to admin_spork_path, notice: "#{project.name} marked innocent."
  end

  def unmark_innocent
    project = policy_scope(Project).kept.find(params[:project_id])
    project.spork_check&.update!(innocent_at: nil, innocent_by: nil, innocent_note: nil)
    audit!("spork.unmarked_innocent", target: project)
    redirect_back_or_to admin_spork_path, notice: "#{project.name} is back in the Spork queue."
  end

  def start_checking
    project = policy_scope(Project).kept.find(params[:project_id])
    check = project.spork_check
    return redirect_back_or_to admin_spork_path, alert: "#{project.name} has not been screened yet." unless check

    check.update!(checking_at: Time.current, checking_by: current_user)
    audit!("spork.checking_started", target: project)
    redirect_back_or_to admin_spork_path, notice: "You're checking #{project.name}."
  end

  def stop_checking
    project = policy_scope(Project).kept.find(params[:project_id])
    project.spork_check&.update!(checking_at: nil, checking_by: nil)
    audit!("spork.checking_stopped", target: project)
    redirect_back_or_to admin_spork_path, notice: "Stopped checking #{project.name}."
  end

  def flag
    project = policy_scope(Project).kept.find(params[:project_id])
    reason = params[:reason].to_s.strip
    return redirect_back_or_to admin_spork_path, alert: "A reason is required to flag a project." if reason.blank?

    project.update!(flagged_for_review_at: Time.current, flag_reason: reason, flagged_by: current_user)
    project.spork_check&.update!(checking_at: nil, checking_by: nil)
    audit!("project.flagged_for_review", target: project, metadata: { reason: reason, source: "spork" })
    redirect_back_or_to admin_spork_path, notice: "#{project.name} flagged for review."
  end

  def lookup
    query = params[:repo].to_s.strip
    return render json: { error: "Enter a GitHub repo." }, status: :unprocessable_entity if query.blank?

    token = SecureRandom.hex(16)
    SporkLookupJob.perform_later(current_user.id, token, query)
    audit!("spork.lookup", target: nil, metadata: { repo: query })
    render json: { token: token }
  end

  def lookup_status
    result = Rails.cache.read(SporkLookupJob.cache_key(current_user.id, params[:token].to_s))
    render json: result || { status: "pending" }
  end

  private

  def require_fraud_permission!
    require_permission!("fraud")
  end

  def filter_scope(scope, filter)
    case filter
    when "queue" then scope.merge(SporkCheck.hits.not_innocent).not_flagged_for_review
    when "checking" then scope.merge(SporkCheck.checking)
    when "hits" then scope.merge(SporkCheck.hits)
    when "innocent" then scope.merge(SporkCheck.innocent)
    when "exclusive" then scope.where(spork_checks: { verdict: "exclusive_match" })
    when "failed" then scope.where(spork_checks: { verdict: "failed" })
    when "unscreened" then scope.with_github_repo.where(spork_checks: { id: nil })
    else scope
    end
  end

  def search_scope(scope, query)
    like = "%#{Project.sanitize_sql_like(query)}%"
    scope.where(id: Project.search(query).reorder(nil).select(:id))
         .or(scope.where("projects.repo_link ILIKE :q OR spork_checks.repo ILIKE :q", q: like))
  end

  def stats
    counts = SporkCheck.for_active_owners.merge(Project.kept).group(:verdict).count
    {
      queue: SporkCheck.queued.count,
      screenable: Project.kept.with_github_repo.count,
      screened: counts.values.sum,
      exclusive: counts["exclusive_match"].to_i,
      shared: counts["shared_template"].to_i,
      failed: counts["failed"].to_i,
      last_checked_at: SporkCheck.maximum(:checked_at)&.strftime("%b %d, %Y %H:%M")
    }
  end

  def serialize_row(project)
    {
      id: project.id,
      name: project.name,
      status: project.status,
      repo_link: project.repo_link,
      user_display_name: project.user&.display_name,
      flagged: project.flagged_for_review?,
      spork: spork_check_summary_props(project.spork_check)
    }
  end
end
