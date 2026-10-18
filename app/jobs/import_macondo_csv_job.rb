class ImportMacondoCsvJob < ApplicationJob
  queue_as :default

  AUDIT_ACTION = "macondo.csv_imported".freeze

  def perform(blob_id, actor_id)
    blob = ActiveStorage::Blob.find_by(id: blob_id)
    unless blob
      Rails.logger.warn("ImportMacondoCsvJob: blob #{blob_id} not found, aborting")
      return
    end

    result = MacondoCsvImport.call(blob.download)

    AuditEvent.create!(
      actor_id: actor_id,
      action: AUDIT_ACTION,
      metadata: {
        filename: blob.filename.to_s,
        imported: result[:imported],
        already_imported: result[:already_imported],
        placeholder_owners: result[:placeholder_owners],
        placeholder_collaborators: result[:placeholder_collaborators],
        failures: result[:failures]
      }
    )

    blob.purge_later
  end
end
