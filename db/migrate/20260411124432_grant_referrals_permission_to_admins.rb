class GrantReferralsPermissionToAdmins < ActiveRecord::Migration[8.1]
  def up
    execute <<-SQL.squish
      UPDATE users
      SET permissions = array_append(permissions, 'referrals')
      WHERE 'admin' = ANY(roles)
      AND NOT ('referrals' = ANY(permissions))
    SQL
  end

  def down
    execute <<-SQL.squish
      UPDATE users
      SET permissions = array_remove(permissions, 'referrals')
    SQL
  end
end
