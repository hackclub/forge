class AddUsesAiToProjects < ActiveRecord::Migration[8.1]
  def change
    add_column :projects, :uses_ai, :boolean, default: false, null: false
    add_column :projects, :ai_usage, :text
  end
end
