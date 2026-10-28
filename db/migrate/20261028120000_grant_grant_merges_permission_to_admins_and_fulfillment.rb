class GrantGrantMergesPermissionToAdminsAndFulfillment < ActiveRecord::Migration[8.1]
  def up
    execute <<-SQL.squish
      UPDATE users
      SET permissions = array_append(permissions, 'grant_merges')
      WHERE ('admin' = ANY(roles) OR 'fulfillment' = ANY(roles))
      AND NOT ('grant_merges' = ANY(permissions))
    SQL
  end

  def down
    execute <<-SQL.squish
      UPDATE users
      SET permissions = array_remove(permissions, 'grant_merges')
    SQL
  end
end
