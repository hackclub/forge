class AddApprovalJustificationToProjects < ActiveRecord::Migration[8.1]
  def change
    add_column :projects, :approval_justification, :text
  end
end
