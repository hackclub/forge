class AddHeartbeatsCountToReviewSessions < ActiveRecord::Migration[8.1]
  def change
    add_column :review_sessions, :heartbeats_count, :integer, default: 0, null: false
  end
end
