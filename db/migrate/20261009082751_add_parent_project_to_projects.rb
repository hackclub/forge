class AddParentProjectToProjects < ActiveRecord::Migration[8.1]
  def change
    add_reference :projects, :parent_project, foreign_key: { to_table: :projects }
  end
end
