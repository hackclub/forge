class ChangeUserRoleToArray < ActiveRecord::Migration[8.1]
  def up
    add_column :users, :roles, :string, array: true, default: []

    execute <<-SQL
      UPDATE users
      SET roles = CASE
        WHEN role = 0 THEN ARRAY['user']::varchar[]
        WHEN role = 1 THEN ARRAY['admin']::varchar[]
        ELSE ARRAY['user']::varchar[]
      END
    SQL

    change_column_null :users, :roles, false
    remove_column :users, :role
  end

  def down
    add_column :users, :role, :integer, default: 0, null: false

    execute <<-SQL
      UPDATE users
      SET role = CASE
        WHEN 'admin' = ANY(roles) THEN 1
        ELSE 0
      END
    SQL

    remove_column :users, :roles
  end
end
