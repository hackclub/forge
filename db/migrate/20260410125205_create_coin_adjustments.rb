class CreateCoinAdjustments < ActiveRecord::Migration[8.1]
  def change
    create_table :coin_adjustments do |t|
      t.references :user, null: false, foreign_key: true
      t.references :actor, foreign_key: { to_table: :users }
      t.decimal :amount, precision: 10, scale: 2, null: false
      t.text :reason, null: false

      t.timestamps
    end
  end
end
