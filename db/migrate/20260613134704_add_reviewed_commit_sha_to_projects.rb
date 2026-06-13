class AddReviewedCommitShaToProjects < ActiveRecord::Migration[8.1]
  def change
    add_column :projects, :reviewed_commit_sha, :string
  end
end
