class BackfillAdminPermissions < ActiveRecord::Migration[8.1]
  def up
    all_perms = %w[pending_reviews projects users ships feature_flags audit_log jobs third_party support]
    pg_array = "{#{all_perms.join(',')}}"

    execute <<-SQL.squish
      UPDATE users
      SET permissions = '#{pg_array}'
      WHERE 'admin' = ANY(roles)
      AND (permissions = '{}' OR permissions IS NULL)
    SQL
  end

  def down
    # no-op
  end
end
