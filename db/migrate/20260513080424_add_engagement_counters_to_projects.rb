class AddEngagementCountersToProjects < ActiveRecord::Migration[8.1]
  def up
    add_column :projects, :views_count, :integer, default: 0, null: false
    add_column :projects, :kudos_count, :integer, default: 0, null: false

    execute <<~SQL
      UPDATE projects p
      SET kudos_count = (SELECT COUNT(*) FROM kudos k WHERE k.project_id = p.id)
    SQL
  end

  def down
    remove_column :projects, :kudos_count
    remove_column :projects, :views_count
  end
end
