class AddShadowBannedToProjects < ActiveRecord::Migration[8.1]
  def change
    add_column :projects, :shadow_banned, :boolean, default: false, null: false
  end
end
