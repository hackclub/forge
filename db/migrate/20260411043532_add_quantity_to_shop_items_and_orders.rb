class AddQuantityToShopItemsAndOrders < ActiveRecord::Migration[8.1]
  def change
    add_column :shop_items, :max_quantity, :integer
    add_column :orders, :quantity, :integer, default: 1, null: false
  end
end
