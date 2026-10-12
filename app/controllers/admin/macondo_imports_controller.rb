class Admin::MacondoImportsController < Admin::ApplicationController
  before_action :require_superadmin!

  MAX_CSV_BYTES = 25.megabytes
  UPLOAD_AUDIT_ACTION = "macondo.csv_upload".freeze

  def show
    imported = Project.kept.where.not(macondo_project_id: nil)

    render inertia: "Admin/MacondoImport/Show", props: {
      last_run: serialize_last_run,
      queued_at: serialize_queued_at,
      max_megabytes: MAX_CSV_BYTES / 1.megabyte,
      stats: {
        imported: imported.count,
        awaiting_tier_confirmation: imported.where(macondo_tier_confirmed_at: nil).count
      }
    }
  end

  def create
    file = params[:file]
    unless file.respond_to?(:tempfile)
      redirect_to admin_macondo_import_path, alert: "Pick a CSV export first."
      return
    end

    if file.size > MAX_CSV_BYTES
      redirect_to admin_macondo_import_path, alert: "That file is bigger than #{MAX_CSV_BYTES / 1.megabyte}MB."
      return
    end

    blob = ActiveStorage::Blob.create_and_upload!(
      io: file.tempfile,
      filename: file.original_filename,
      content_type: "text/csv"
    )
    ImportMacondoCsvJob.perform_later(blob.id, current_user.id)
    audit!(UPLOAD_AUDIT_ACTION, metadata: { filename: file.original_filename, byte_size: file.size })

    redirect_to admin_macondo_import_path, notice: "Import queued. Results land on this page once it finishes."
  end

  private

  def require_superadmin!
    require_permission!("superadmin")
  end

  def serialize_last_run
    event = AuditEvent.for_action(ImportMacondoCsvJob::AUDIT_ACTION).includes(:actor).order(created_at: :desc).first
    return nil unless event

    {
      ran_at: event.created_at.strftime("%b %d, %Y %H:%M"),
      actor: event.actor&.display_name,
      filename: event.metadata["filename"],
      imported: event.metadata["imported"] || [],
      already_imported: event.metadata["already_imported"].to_i,
      missing_owners: event.metadata["missing_owners"] || [],
      missing_collaborators: event.metadata["missing_collaborators"] || [],
      failures: event.metadata["failures"] || []
    }
  end

  def serialize_queued_at
    upload = AuditEvent.for_action(UPLOAD_AUDIT_ACTION).order(created_at: :desc).first
    return nil if upload.nil?

    finished = AuditEvent.for_action(ImportMacondoCsvJob::AUDIT_ACTION).order(created_at: :desc).first
    return nil if finished && finished.created_at > upload.created_at

    upload.created_at.strftime("%b %d, %Y %H:%M")
  end
end
