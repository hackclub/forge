class AddDevlogReviewFields < ActiveRecord::Migration[8.1]
  def change
    add_column :devlogs, :status, :integer, default: 0, null: false
    add_column :devlogs, :approved_hours, :decimal
    add_column :devlogs, :reviewer_id, :bigint
    add_column :devlogs, :reviewed_at, :datetime
    add_column :devlogs, :review_feedback, :text

    add_index :devlogs, :status
    add_foreign_key :devlogs, :users, column: :reviewer_id

    # Grandfather existing devlogs as approved
    reversible do |dir|
      dir.up do
        execute "UPDATE devlogs SET status = 2 WHERE status = 0"
      end
    end
  end
end
