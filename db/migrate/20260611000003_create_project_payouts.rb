class CreateProjectPayouts < ActiveRecord::Migration[8.1]
  def change
    create_table :project_payouts do |t|
      t.references :project, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.decimal :hours, precision: 10, scale: 2, null: false
      t.decimal :coins, precision: 10, scale: 2, null: false
      t.integer :streak_at_approval
      t.decimal :streak_multiplier, precision: 5, scale: 3
      t.decimal :guild_multiplier, precision: 5, scale: 3

      t.timestamps
    end

    add_index :project_payouts, [ :project_id, :user_id ], unique: true
  end
end
