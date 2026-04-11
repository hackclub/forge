class AddShopUnlockedToUsers < ActiveRecord::Migration[8.1]
  def change
    add_column :users, :shop_unlocked, :boolean, default: false, null: false
  end
end
