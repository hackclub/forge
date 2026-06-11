class AddUserToDevlogs < ActiveRecord::Migration[8.1]
  def up
    add_reference :devlogs, :user, foreign_key: true

    execute <<~SQL
      UPDATE devlogs SET user_id = projects.user_id
      FROM projects WHERE projects.id = devlogs.project_id
    SQL

    change_column_null :devlogs, :user_id, false
  end

  def down
    remove_reference :devlogs, :user
  end
end
