class CreateContractorInvoices < ActiveRecord::Migration[8.1]
  def change
    create_table :contractor_invoices do |t|
      t.references :user, null: false, foreign_key: true
      t.references :contractor_agreement, null: false, foreign_key: true
      t.date :week_start, null: false
      t.integer :status, null: false, default: 0
      t.jsonb :line_items, null: false, default: []
      t.integer :review_count, null: false, default: 0
      t.integer :total_cents, null: false, default: 0
      t.string :signed_name
      t.string :signed_ip
      t.datetime :signed_at
      t.datetime :paid_at
      t.references :paid_by, foreign_key: { to_table: :users }

      t.timestamps
    end
    add_index :contractor_invoices, [ :user_id, :week_start ], unique: true
    add_index :contractor_invoices, :status
  end
end
