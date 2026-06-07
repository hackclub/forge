class CreateGuildStates < ActiveRecord::Migration[8.1]
  def change
    create_table :guild_states do |t|
      t.integer :guild, null: false
      t.decimal :multiplier, precision: 5, scale: 3, default: "1.000", null: false
      t.integer :members_active_week, default: 0, null: false
      t.integer :referrals_week, default: 0, null: false
      t.datetime :computed_at
      t.timestamps
    end

    add_index :guild_states, :guild, unique: true
  end
end
