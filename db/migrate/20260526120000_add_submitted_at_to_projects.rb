class AddSubmittedAtToProjects < ActiveRecord::Migration[8.1]
  def up
    add_column :projects, :submitted_at, :datetime
    add_index :projects, :submitted_at

    # Backfill from audit events: most recent project.submitted_for_review per project, fallback to created_at.
    execute <<~SQL
      UPDATE projects p
      SET submitted_at = COALESCE(latest.created_at, p.created_at)
      FROM (
        SELECT target_id, MAX(created_at) AS created_at
        FROM audit_events
        WHERE target_type = 'Project'
          AND action = 'project.submitted_for_review'
        GROUP BY target_id
      ) latest
      WHERE latest.target_id = p.id
    SQL

    execute <<~SQL
      UPDATE projects
      SET submitted_at = created_at
      WHERE submitted_at IS NULL
    SQL
  end

  def down
    remove_index :projects, :submitted_at
    remove_column :projects, :submitted_at
  end
end
