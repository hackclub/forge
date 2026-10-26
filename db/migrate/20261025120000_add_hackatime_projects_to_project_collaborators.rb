class AddHackatimeProjectsToProjectCollaborators < ActiveRecord::Migration[8.1]
  def change
    add_column :project_collaborators, :hackatime_projects, :string, array: true, default: [], null: false
  end
end
