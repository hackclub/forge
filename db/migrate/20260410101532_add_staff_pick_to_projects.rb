class AddStaffPickToProjects < ActiveRecord::Migration[8.1]
  def change
    add_column :projects, :staff_pick_at, :datetime
    add_index :projects, :staff_pick_at
  end
end
