class CreateBadges < ActiveRecord::Migration[8.1]
  def change
    create_table :badges do |t|
      t.references :user, null: false, foreign_key: true
      t.references :awarder, null: true, foreign_key: { to_table: :users }
      t.string :key
      t.string :name, null: false
      t.text :description
      t.string :icon, null: false, default: "military_tech"
      t.string :color, null: false, default: "orange"
      t.datetime :awarded_at, null: false

      t.timestamps
    end

    add_index :badges, [ :user_id, :key ], unique: true, where: "key IS NOT NULL"
  end
end
