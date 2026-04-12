class AddShopRegions < ActiveRecord::Migration[8.1]
  def change
    create_table :shop_item_regions do |t|
      t.references :shop_item, null: false, foreign_key: true
      t.string :region, null: false
      t.decimal :coin_cost, precision: 10, scale: 2, null: false
      t.boolean :enabled, default: true, null: false
      t.timestamps
    end

    add_index :shop_item_regions, [ :shop_item_id, :region ], unique: true
    add_index :shop_item_regions, :region

    add_column :users, :region, :string, default: "rest_of_world"
    add_column :users, :fulfillment_regions, :string, array: true, default: [], null: false

    add_column :orders, :region, :string
    add_reference :orders, :assigned_to, foreign_key: { to_table: :users }
    add_index :orders, :region
  end
end
