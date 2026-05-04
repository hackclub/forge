class CreateReelPayoutRequests < ActiveRecord::Migration[8.1]
  def change
    create_table :reel_payout_requests do |t|
      t.references :reel, null: false, foreign_key: true
      t.references :reviewer, foreign_key: { to_table: :users }
      t.decimal :amount, precision: 10, scale: 2, null: false
      t.string :status, null: false, default: "pending"
      t.text :reason
      t.datetime :reviewed_at

      t.timestamps
    end

    add_index :reel_payout_requests, :status
    add_index :reel_payout_requests, :created_at
  end
end
