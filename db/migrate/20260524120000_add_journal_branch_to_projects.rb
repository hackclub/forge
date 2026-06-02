class AddJournalBranchToProjects < ActiveRecord::Migration[8.1]
  def change
    add_column :projects, :journal_branch, :string
  end
end
