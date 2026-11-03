class GrantMetricsPermissionToAuditLogHolders < ActiveRecord::Migration[8.1]
  def up
    execute <<-SQL.squish
      UPDATE users
      SET permissions = array_append(permissions, 'metrics')
      WHERE 'audit_log' = ANY(permissions)
      AND NOT ('metrics' = ANY(permissions))
    SQL
  end

  def down
    execute <<-SQL.squish
      UPDATE users
      SET permissions = array_remove(permissions, 'metrics')
    SQL
  end
end
