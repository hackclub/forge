class AddHcbGrantLinkToProjects < ActiveRecord::Migration[8.1]
  def change
    add_column :projects, :hcb_grant_link, :string
  end
end
