class Admin::SporkController < Admin::ApplicationController
  include SporkProps

  FILTERS = %w[hits exclusive failed unscreened all].freeze
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
    filter = FILTERS.include?(params[:filter]) ? params[:filter] : (query.present? ? "all" : "hits")

    scope = policy_scope(Project).kept.left_joins(:spork_check).preload(:spork_check, :user)
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
    when "hits" then scope.merge(SporkCheck.hits)
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
    counts = SporkCheck.joins(:project).merge(Project.kept).group(:verdict).count
    {
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
      spork: spork_check_summary_props(project.spork_check)
    }
  end
end
