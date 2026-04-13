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
    redirect_to admin_airtable_queue_index_path, notice: "Item cancelled."
  end

  private

  def require_superadmin!
    raise ActionController::RoutingError, "Not Found" unless current_user&.superadmin?
  end

  def serialize(item, full: false)
    data = {
      id: item.id,
      status: item.status,
      table_name: item.table_name,
      forge_id: item.forge_id,
      project_id: item.project_id,
      project_name: item.project&.name,
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
