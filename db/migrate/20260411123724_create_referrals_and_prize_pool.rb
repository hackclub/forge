class CreateReferralsAndPrizePool < ActiveRecord::Migration[8.1]
  def change
    add_column :users, :referral_code, :string
    add_index :users, :referral_code, unique: true

    create_table :referrals do |t|
      t.references :referrer, null: false, foreign_key: { to_table: :users }
      t.references :referred, null: false, foreign_key: { to_table: :users }, index: { unique: true }
      t.integer :status, null: false, default: 0
      t.references :qualifying_project, foreign_key: { to_table: :projects }
      t.references :payout_adjustment, foreign_key: { to_table: :coin_adjustments }
      t.references :approver, foreign_key: { to_table: :users }
      t.datetime :eligible_at
      t.datetime :approved_at
      t.timestamps
    end

    add_index :referrals, :status

    create_table :referral_prize_pools do |t|
      t.decimal :amount, precision: 10, scale: 2, null: false, default: 0
      t.decimal :total_paid_out, precision: 10, scale: 2, null: false, default: 0
      t.timestamps
    end
  end
end
