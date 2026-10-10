class DropReferralPrizePools < ActiveRecord::Migration[8.1]
  def change
    drop_table :referral_prize_pools do |t|
      t.decimal :amount, precision: 10, scale: 2, default: "0.0", null: false
      t.decimal :total_paid_out, precision: 10, scale: 2, default: "0.0", null: false
      t.timestamps
    end
  end
end
