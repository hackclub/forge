class CreateReviewSessions < ActiveRecord::Migration[8.1]
  def change
    create_table :review_sessions do |t|
      t.references :project, null: false, foreign_key: true
      t.references :reviewer, null: false, foreign_key: { to_table: :users }
      t.datetime :started_at, null: false
      t.datetime :ended_at
      t.integer :active_seconds, default: 0, null: false
      t.datetime :last_heartbeat_at
      t.string :decision

      t.timestamps
    end

    add_index :review_sessions, [ :project_id, :reviewer_id ]
    add_index :review_sessions, :ended_at
  end
end
