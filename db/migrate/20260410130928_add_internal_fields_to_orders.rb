class AddInternalFieldsToOrders < ActiveRecord::Migration[8.1]
  def change
    add_column :orders, :internal_order_link, :string
    add_column :orders, :internal_price_usd, :decimal, precision: 10, scale: 2
    remove_column :shop_items, :sort_order, :integer, default: 0, null: false
  end
end
