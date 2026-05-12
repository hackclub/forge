class Admin::AirtableSyncController < Admin::ApplicationController
  before_action :require_admin!

  def index
    drift = Rails.cache.read(AirtableSyncCheckJob::CACHE_KEY)
    missing_ids = drift&.dig(:missing_from_airtable) || []
    orphan_ids = drift&.dig(:orphan_in_airtable) || []

    missing_projects = Project.where(id: missing_ids).includes(:user).map { |p| serialize_project(p) }
    orphan_projects = Project.where(id: orphan_ids).includes(:user).map { |p| serialize_project(p) }

    render inertia: "Admin/AirtableSync/Index", props: {
      checked_at: drift&.dig(:checked_at),
      airtable_enabled: AirtableService.enabled?,
      missing: missing_projects,
      orphan: orphan_projects,
      counts: {
        approved: drift&.dig(:approved_count),
        airtable: drift&.dig(:airtable_count)
      }
    }
  end

  def recheck
    AirtableSyncCheckJob.perform_later
    redirect_to admin_airtable_sync_path, notice: "Sync check queued — refresh in a minute."
  end

  def requeue
    project = Project.find(params[:project_id])
    AirtableQueueItem.enqueue_for_project(project)
    audit!("project.airtable_requeued", target: project, metadata: { source: "sync_drift" })
    redirect_to admin_airtable_sync_path, notice: "Project ##{project.id} queued for Airtable resend."
  end

  private

  def serialize_project(project)
    {
      id: project.id,
      name: project.name,
      user_display_name: project.user&.display_name,
      status: project.status,
      reviewed_at: project.reviewed_at&.strftime("%b %d, %Y"),
      created_at: project.created_at.strftime("%b %d, %Y")
    }
  end
end
