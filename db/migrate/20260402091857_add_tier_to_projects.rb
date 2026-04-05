class AddTierToProjects < ActiveRecord::Migration[8.1]
  def change
    add_column :projects, :tier, :string, default: "normal", null: false
    add_column :projects, :budget, :text
  end
end
