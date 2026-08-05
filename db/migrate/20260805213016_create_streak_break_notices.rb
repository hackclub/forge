class CreateStreakBreakNotices < ActiveRecord::Migration[8.1]
  def change
    create_table :streak_break_notices do |t|
      t.references :user, null: false, foreign_key: true
      t.date :broke_on, null: false
      t.integer :streak_length, null: false

      t.timestamps
    end
    add_index :streak_break_notices, [ :user_id, :broke_on ], unique: true
  end
end
