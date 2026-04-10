class MoveInternalFieldsToShopItems < ActiveRecord::Migration[8.1]
  def change
    add_column :shop_items, :internal_order_link, :string
    add_column :shop_items, :internal_price_usd, :decimal, precision: 10, scale: 2

    remove_column :orders, :internal_order_link, :string
    remove_column :orders, :internal_price_usd, :decimal, precision: 10, scale: 2
  end
end
