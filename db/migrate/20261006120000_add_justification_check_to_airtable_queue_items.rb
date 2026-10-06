class AddJustificationCheckToAirtableQueueItems < ActiveRecord::Migration[8.1]
  def change
    add_column :airtable_queue_items, :justification_check, :jsonb
  end
end
