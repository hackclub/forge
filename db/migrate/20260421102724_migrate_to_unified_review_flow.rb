class MigrateToUnifiedReviewFlow < ActiveRecord::Migration[8.1]
  # Collapses the legacy dual-track review flow (pitch + build) into a single
  # pending/approved flow. Retires build_pending (5) and build_approved (6).
  #
  # Project status remap:
  #   approved       (2) -> pending (1)    legacy devlog-auto state, needs project-level review
  #   build_pending  (5) -> pending (1)    submitted, needs re-review
  #   build_approved (6) with a sent Airtable record -> approved (2)  legitimate final-approved; leave alone
  #   build_approved (6) without one       -> pending (1)    clawback
  #   pitch_approved (7) unchanged — T1 builders keep building
  #   everything else unchanged
  #
  # Devlogs lose their per-entry review state; all statuses collapse to draft.
  # Any pending Airtable queue items are cancelled since the trigger state is gone.
  # Sent Airtable items are left as-is for audit.

  disable_ddl_transaction!

  def up
    ActiveRecord::Base.transaction do
      # Order matters: clear legacy `approved` first, then repopulate from build_approved.
      execute <<~SQL
        UPDATE projects SET status = 1 WHERE status IN (2, 5)
      SQL

      execute <<~SQL
        UPDATE projects
        SET status = 2
        WHERE status = 6
          AND id IN (
            SELECT DISTINCT project_id FROM airtable_queue_items
            WHERE status = 1 AND project_id IS NOT NULL
          )
      SQL

      execute <<~SQL
        UPDATE projects SET status = 1 WHERE status = 6
      SQL

      execute <<~SQL
        UPDATE devlogs
        SET status = 0,
            approved_hours = NULL,
            reviewer_id = NULL,
            reviewed_at = NULL,
            review_feedback = NULL
        WHERE status IN (1, 2, 3)
           OR approved_hours IS NOT NULL
           OR reviewer_id IS NOT NULL
      SQL

      execute <<~SQL
        UPDATE airtable_queue_items
        SET status = 2,
            error = CONCAT(COALESCE(error, ''), '[auto-cancelled: review flow migration]'),
            updated_at = NOW()
        WHERE status = 0
      SQL
    end
  end

  def down
    raise ActiveRecord::IrreversibleMigration
  end
end
