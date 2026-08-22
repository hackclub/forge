class AddHoursLoggedToStreakDays < ActiveRecord::Migration[8.0]
  def change
    add_column :streak_days, :hours_logged, :decimal, precision: 8, scale: 2, default: 0.0, null: false
  end
end
