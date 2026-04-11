class RemoveHcbGrantLinkFromProjects < ActiveRecord::Migration[8.1]
  def change
    remove_column :projects, :hcb_grant_link, :string
  end
end
