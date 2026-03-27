class RemoveDemoLinkAndIsUnlistedFromProjects < ActiveRecord::Migration[8.1]
  def change
    remove_column :projects, :demo_link, :string
    remove_column :projects, :is_unlisted, :boolean, default: false, null: false
    remove_index :projects, :is_unlisted, if_exists: true
  end
end
