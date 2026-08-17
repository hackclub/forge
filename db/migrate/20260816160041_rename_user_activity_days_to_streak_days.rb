class RenameUserActivityDaysToStreakDays < ActiveRecord::Migration[8.1]
  def up
    rename_table :user_activity_days, :streak_days
    rename_column :streak_days, :active_on, :date
    add_column :streak_days, :status, :integer, default: 0, null: false
    execute "UPDATE streak_days SET status = 1"
  end

  def down
    remove_column :streak_days, :status
    rename_column :streak_days, :date, :active_on
    rename_table :streak_days, :user_activity_days
  end
end
