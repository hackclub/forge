class AddShopItemsAndBuildProof < ActiveRecord::Migration[8.1]
  def up
    add_column :projects, :built_at, :datetime
    add_column :projects, :build_proof_url, :string

    create_table :shop_items do |t|
      t.string :name, null: false
      t.text :description
      t.string :image_url
      t.decimal :coin_cost, precision: 10, scale: 2, null: false
      t.boolean :enabled, default: true, null: false
      t.integer :sort_order, default: 0, null: false

      t.timestamps
    end

    add_index :shop_items, [ :enabled, :sort_order ]

    add_reference :orders, :shop_item, foreign_key: true
    change_column_null :orders, :amount_usd, true
    execute "UPDATE orders SET kind = 'shop_item' WHERE kind = 'misc_grant'"
  end

  def down
    execute "UPDATE orders SET kind = 'misc_grant' WHERE kind = 'shop_item'"
    change_column_null :orders, :amount_usd, false
    remove_reference :orders, :shop_item, foreign_key: true
    drop_table :shop_items
    remove_column :projects, :build_proof_url
    remove_column :projects, :built_at
  end
end
