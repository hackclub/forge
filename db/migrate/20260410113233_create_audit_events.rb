class CreateAuditEvents < ActiveRecord::Migration[8.1]
  def change
    create_table :audit_events do |t|
      t.references :actor, foreign_key: { to_table: :users }
      t.string :action, null: false
      t.string :target_type
      t.bigint :target_id
      t.string :target_label
      t.jsonb :metadata, default: {}, null: false
      t.string :ip_address

      t.timestamps
    end

    add_index :audit_events, :action
    add_index :audit_events, [ :target_type, :target_id ]
    add_index :audit_events, :created_at
  end
end
