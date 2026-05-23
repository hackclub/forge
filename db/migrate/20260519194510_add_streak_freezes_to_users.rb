class AddStreakFreezesToUsers < ActiveRecord::Migration[8.1]
  def change
    add_column :users, :streak_freezes, :integer, default: 1, null: false
  end
end
