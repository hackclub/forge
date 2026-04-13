class AddFlagsToProjects < ActiveRecord::Migration[8.1]
  def change
    add_column :projects, :red_flags, :string, array: true, default: []
    add_column :projects, :green_flags, :string, array: true, default: []
  end
end
