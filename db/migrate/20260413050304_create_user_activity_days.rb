class CreateUserActivityDays < ActiveRecord::Migration[8.1]
  def change
    create_table :user_activity_days do |t|
      t.references :user, null: false, foreign_key: true
      t.date :active_on, null: false

      t.timestamps
    end

    add_index :user_activity_days, [ :user_id, :active_on ], unique: true
  end
end
