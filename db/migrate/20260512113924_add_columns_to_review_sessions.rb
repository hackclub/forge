class AddColumnsToReviewSessions < ActiveRecord::Migration[8.1]
  def change
    add_reference :review_sessions, :project, null: false, foreign_key: true unless column_exists?(:review_sessions, :project_id)
    add_reference :review_sessions, :reviewer, null: false, foreign_key: { to_table: :users } unless column_exists?(:review_sessions, :reviewer_id)

    add_column :review_sessions, :started_at, :datetime, null: false unless column_exists?(:review_sessions, :started_at)
    add_column :review_sessions, :ended_at, :datetime unless column_exists?(:review_sessions, :ended_at)
    add_column :review_sessions, :active_seconds, :integer, default: 0, null: false unless column_exists?(:review_sessions, :active_seconds)
    add_column :review_sessions, :last_heartbeat_at, :datetime unless column_exists?(:review_sessions, :last_heartbeat_at)
    add_column :review_sessions, :decision, :string unless column_exists?(:review_sessions, :decision)

    add_index :review_sessions, [ :project_id, :reviewer_id ] unless index_exists?(:review_sessions, [ :project_id, :reviewer_id ])
    add_index :review_sessions, :ended_at unless index_exists?(:review_sessions, :ended_at)
  end
end
