class AddEntryDateToDevlogs < ActiveRecord::Migration[8.0]
  def up
    add_column :devlogs, :entry_date, :date
    add_index :devlogs, [ :user_id, :entry_date ]

    execute <<~SQL
      UPDATE devlogs
      SET entry_date = (devlogs.created_at AT TIME ZONE 'UTC')::date
      WHERE entry_date IS NULL
    SQL
  end

  def down
    remove_index :devlogs, [ :user_id, :entry_date ]
    remove_column :devlogs, :entry_date
  end
end
