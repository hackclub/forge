class MigrateToUnifiedReviewFlow < ActiveRecord::Migration[8.1]
  # Collapses the legacy dual-track review flow (pitch + build) into a single
  # pending/approved flow. Retires build_pending (5) and build_approved (6).
  #
  # Project status remap:
  #   build_pending  (5) -> pending (1)    submitted, needs re-review
  #   build_approved (6) -> pending (1)    clawback — re-review required
  #   approved       (2) -> pending (1)    legacy devlog-auto state, needs project-level review
  #   pitch_approved (7) unchanged — T1 builders keep building
  #   everything else unchanged
  #
  # Devlogs lose their per-entry review state; all statuses collapse to draft.
  # Any pending Airtable queue items are cancelled since the trigger state is gone.
  # Sent Airtable items are left as-is for audit — cleanup on the Airtable side is manual.

  disable_ddl_transaction!

  def up
    ActiveRecord::Base.transaction do
      execute <<~SQL
        UPDATE projects SET status = 1 WHERE status IN (2, 5, 6)
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
