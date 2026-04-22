class CreateAirtableQueueItems < ActiveRecord::Migration[8.1]
  def change
    create_table :airtable_queue_items do |t|
      t.references :project, null: true, foreign_key: true
      t.string :table_name, null: false
      t.string :forge_id, null: false
      t.jsonb :payload, null: false, default: {}
      t.integer :status, null: false, default: 0
      t.references :enqueued_by, null: true, foreign_key: { to_table: :users }
      t.references :sent_by, null: true, foreign_key: { to_table: :users }
      t.datetime :sent_at
      t.string :airtable_record_id
      t.text :error

      t.timestamps
    end

    add_index :airtable_queue_items, :status
  end
end
