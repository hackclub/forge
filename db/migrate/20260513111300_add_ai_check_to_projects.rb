class AddAiCheckToProjects < ActiveRecord::Migration[8.1]
  def change
    add_column :projects, :ai_check_result, :jsonb
    add_column :projects, :ai_check_ran_at, :datetime
  end
end
