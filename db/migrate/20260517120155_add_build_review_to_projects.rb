class AddBuildReviewToProjects < ActiveRecord::Migration[8.1]
  def change
    add_column :projects, :build_review, :boolean, default: false, null: false
    add_column :projects, :linked_project_id, :bigint
    add_foreign_key :projects, :projects, column: :linked_project_id
    add_index :projects, :linked_project_id, unique: true,
      where: "build_review = true",
      name: "index_projects_on_linked_project_id_for_build_reviews"
  end
end
