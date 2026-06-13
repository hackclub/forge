class AddUniqueActiveReviewSessionIndexToReviewSessions < ActiveRecord::Migration[8.1]
  def up
    execute(<<~SQL.squish)
      UPDATE review_sessions
      SET ended_at = COALESCE(last_heartbeat_at, started_at, now())
      WHERE ended_at IS NULL
        AND id NOT IN (
          SELECT DISTINCT ON (project_id, reviewer_id) id
          FROM review_sessions
          WHERE ended_at IS NULL
          ORDER BY project_id, reviewer_id, last_heartbeat_at DESC NULLS LAST, id DESC
        )
    SQL

    add_index :review_sessions, [ :project_id, :reviewer_id ],
              unique: true,
              where: "ended_at IS NULL",
              name: "index_review_sessions_one_active_per_reviewer_project"

    add_index :review_sessions, [ :project_id, :last_heartbeat_at ],
              where: "ended_at IS NULL",
              name: "index_review_sessions_active_heartbeat"
  end

  def down
    remove_index :review_sessions, name: "index_review_sessions_one_active_per_reviewer_project"
    remove_index :review_sessions, name: "index_review_sessions_active_heartbeat"
  end
end
