class UpdateProjectTiersAndCreateOrders < ActiveRecord::Migration[8.1]
  def up
    execute <<~SQL.squish
      UPDATE projects SET tier = 'tier_1' WHERE tier = 'normal';
    SQL
    execute <<~SQL.squish
      UPDATE projects SET tier = 'tier_4' WHERE tier = 'advanced';
    SQL
    change_column_default :projects, :tier, "tier_1"

    create_table :orders do |t|
      t.references :user, null: false, foreign_key: true
      t.references :project, foreign_key: true
      t.references :reviewer, foreign_key: { to_table: :users }
      t.string :kind, null: false
      t.integer :status, default: 0, null: false
      t.decimal :amount_usd, precision: 10, scale: 2, null: false
      t.decimal :coin_cost, precision: 10, scale: 2, null: false
      t.text :description
      t.text :review_notes
      t.string :hcb_grant_link
      t.datetime :reviewed_at
      t.datetime :fulfilled_at

      t.timestamps
    end

    add_index :orders, :status
    add_index :orders, :kind
  end

  def down
    drop_table :orders
    change_column_default :projects, :tier, "normal"
    execute <<~SQL.squish
      UPDATE projects SET tier = 'normal' WHERE tier = 'tier_1';
    SQL
    execute <<~SQL.squish
      UPDATE projects SET tier = 'advanced' WHERE tier IN ('tier_2', 'tier_3', 'tier_4');
    SQL
  end
end
