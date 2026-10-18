class ScopeBuildReviewLinkIndexToKeptProjects < ActiveRecord::Migration[8.1]
  def change
    remove_index :projects, :linked_project_id, unique: true,
      where: "build_review = true",
      name: "index_projects_on_linked_project_id_for_build_reviews"
    add_index :projects, :linked_project_id, unique: true,
      where: "build_review = true AND discarded_at IS NULL",
      name: "index_projects_on_linked_project_id_for_build_reviews"
  end
end
