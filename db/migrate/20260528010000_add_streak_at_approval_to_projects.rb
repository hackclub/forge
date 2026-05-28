class AddStreakAtApprovalToProjects < ActiveRecord::Migration[8.1]
  def up
    add_column :projects, :streak_at_approval, :integer
  end

  def down
    remove_column :projects, :streak_at_approval
  end
end
