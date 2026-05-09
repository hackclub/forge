class Admin::AirtableQueueController < Admin::ApplicationController
  before_action :require_superadmin!

  def index
    scope = AirtableQueueItem.includes(:project, :enqueued_by, :sent_by).recent
    scope = scope.where(status: params[:status_filter]) if params[:status_filter].present?
    @pagy, @items = pagy(scope, limit: 50)

    render inertia: "Admin/AirtableQueue/Index", props: {
      items: @items.map { |i| serialize(i) },
      pagy: pagy_props(@pagy),
      filters: { status: params[:status_filter].to_s },
      counts: {
        pending: AirtableQueueItem.pending.count,
        sent: AirtableQueueItem.sent.count,
        failed: AirtableQueueItem.failed.count,
        cancelled: AirtableQueueItem.cancelled.count
      },
      airtable_enabled: AirtableService.enabled?
    }
  end

  def show
    item = AirtableQueueItem.includes(:project, :enqueued_by, :sent_by).find(params[:id])

    render inertia: "Admin/AirtableQueue/Show", props: {
      item: serialize(item, full: true),
      airtable_enabled: AirtableService.enabled?
    }
  end

  def send_to_airtable
    item = AirtableQueueItem.find(params[:id])

    unless AirtableService.enabled?
      redirect_to admin_airtable_queue_path(item), alert: "Airtable is not configured."
      return
    end

    if item.send_to_airtable!(actor: current_user)
      audit!("airtable.sent", target: item.project, metadata: { queue_item_id: item.id, airtable_record_id: item.airtable_record_id, table: item.table_name })
      redirect_to admin_airtable_queue_path(item), notice: "Sent to Airtable."
    else
      redirect_to admin_airtable_queue_path(item), alert: "Airtable send failed: #{item.error}"
    end
  end

  def cancel
    item = AirtableQueueItem.find(params[:id])

    unless item.pending?
      redirect_to admin_airtable_queue_path(item), alert: "Only pending items can be cancelled."
      return
    end

    item.update!(status: :cancelled)
    audit!("airtable.cancelled", target: item.project, metadata: { queue_item_id: item.id })

    notice = "Item cancelled."
    if revert_inconsistent_project!(item.project, queue_item_id: item.id)
      notice = "Item cancelled and project approval reverted to returned."
    end

    redirect_to admin_airtable_queue_index_path, notice: notice
  end

  def revert_project
    item = AirtableQueueItem.find(params[:id])

    unless item.cancelled? || item.failed?
      redirect_to admin_airtable_queue_path(item), alert: "Only cancelled or failed items can revert their project."
      return
    end

    if item.project.blank?
      redirect_to admin_airtable_queue_path(item), alert: "Original project is no longer available."
      return
    end

    if revert_inconsistent_project!(item.project, queue_item_id: item.id)
      redirect_to admin_project_path(item.project), notice: "Project approval reverted to returned."
    else
      redirect_to admin_airtable_queue_path(item), alert: "Project is not in an inconsistent approved state."
    end
  end

  def retry
    item = AirtableQueueItem.find(params[:id])

    unless item.failed?
      redirect_to admin_airtable_queue_path(item), alert: "Only failed items can be retried."
      return
    end

    if item.project.blank?
      redirect_to admin_airtable_queue_path(item), alert: "Original project is no longer available."
      return
    end

    new_item = AirtableQueueItem.enqueue_for_project(item.project, table: item.table_name)
    new_item.update!(enqueued_by: current_user)
    audit!("airtable.retried", target: item.project, metadata: { from_queue_item_id: item.id, queue_item_id: new_item.id })
    redirect_to admin_airtable_queue_path(new_item), notice: "Re-queued with the latest project data."
  end

  private

  def require_superadmin!
    raise ActionController::RoutingError, "Not Found" unless current_user&.superadmin?
  end

  def revert_inconsistent_project!(project, queue_item_id:)
    return false if project.blank?
    return false unless project.approved?
    return false if project.airtable_queue_items.where(status: [ :pending, :sent ]).exists?

    feedback = "Removed from Airtable queue — please address override hours justification or other concerns and resubmit."
    project.update!(status: :returned, review_feedback: feedback, reviewed_at: Time.current, reviewer: current_user)
    audit!("project.returned", target: project, metadata: { reason: "airtable_cancelled", queue_item_id: queue_item_id, feedback: feedback })
    true
  end

  def serialize(item, full: false)
    project = item.project
    data = {
      id: item.id,
      status: item.status,
      table_name: item.table_name,
      forge_id: item.forge_id,
      project_id: item.project_id,
      project_name: project&.name,
      project_status: project&.status,
      project_inconsistent: project&.approved? && !project.airtable_queue_items.where(status: [ :pending, :sent ]).exists? || false,
      enqueued_by: item.enqueued_by&.display_name,
      sent_by: item.sent_by&.display_name,
      sent_at: item.sent_at&.strftime("%b %d, %Y %H:%M"),
      airtable_record_id: item.airtable_record_id,
      error: item.error,
      created_at: item.created_at.strftime("%b %d, %Y %H:%M")
    }
    data[:payload] = item.payload if full
    data
  end
end
