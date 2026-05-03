class AddLifetimePayoutToReels < ActiveRecord::Migration[8.1]
  def change
    add_column :reels, :lifetime_payout_coins, :decimal, precision: 10, scale: 2, default: 0, null: false
  end
end
