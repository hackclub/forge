class AddHackatimeProjectsToProjects < ActiveRecord::Migration[8.1]
  def change
    add_column :projects, :hackatime_projects, :string, array: true, default: [], null: false
  end
end
