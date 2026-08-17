class AddRequirementsCheckToProjects < ActiveRecord::Migration[8.1]
  def change
    add_column :projects, :requirements_checked_at, :datetime
    add_reference :projects, :requirements_checked_by, null: true, foreign_key: { to_table: :users }
    add_column :projects, :requirements_check_items, :jsonb, default: [], null: false
    add_index :projects, :requirements_checked_at
  end
end
