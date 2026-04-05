class AddSubtitleToProjects < ActiveRecord::Migration[8.1]
  def change
    add_column :projects, :subtitle, :string
  end
end
