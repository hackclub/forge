class AddStatusToProjects < ActiveRecord::Migration[8.1]
  def change
    add_column :projects, :status, :integer, default: 0, null: false
    add_column :projects, :reviewer_id, :bigint, null: true
    add_column :projects, :reviewed_at, :datetime, null: true
    add_column :projects, :review_feedback, :text, null: true

    add_index :projects, :status
    add_foreign_key :projects, :users, column: :reviewer_id
  end
end
