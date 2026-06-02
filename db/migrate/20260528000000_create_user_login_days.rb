class CreateUserLoginDays < ActiveRecord::Migration[8.1]
  def up
    create_table :user_login_days do |t|
      t.references :user, null: false, foreign_key: true
      t.date :login_on, null: false
      t.timestamps
    end

    add_index :user_login_days, [ :user_id, :login_on ], unique: true
    add_index :user_login_days, :login_on

    execute <<~SQL
      INSERT INTO user_login_days (user_id, login_on, created_at, updated_at)
      SELECT user_id, login_on, NOW(), NOW()
      FROM (
        SELECT DISTINCT user_id, DATE(started_at) AS login_on
        FROM ahoy_visits
        WHERE user_id IS NOT NULL
        UNION
        SELECT DISTINCT actor_id AS user_id, DATE(created_at) AS login_on
        FROM audit_events
        WHERE actor_id IS NOT NULL
      ) backfill
      WHERE EXISTS (SELECT 1 FROM users WHERE users.id = backfill.user_id)
      ON CONFLICT (user_id, login_on) DO NOTHING
    SQL
  end

  def down
    drop_table :user_login_days
  end
end
