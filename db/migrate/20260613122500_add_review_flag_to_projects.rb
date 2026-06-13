class AddReviewFlagToProjects < ActiveRecord::Migration[8.1]
  def change
    add_column :projects, :flagged_for_review_at, :datetime
    add_column :projects, :flag_reason, :text
    add_reference :projects, :flagged_by, null: true, foreign_key: { to_table: :users }
    add_index :projects, :flagged_for_review_at
  end
end
