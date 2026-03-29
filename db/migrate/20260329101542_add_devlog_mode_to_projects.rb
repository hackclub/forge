class AddDevlogModeToProjects < ActiveRecord::Migration[8.1]
  def change
    add_column :projects, :devlog_mode, :string
  end
end
