class AddMaintenanceBypassToUsers < ActiveRecord::Migration[8.1]
  def change
    add_column :users, :maintenance_bypass, :boolean, default: false, null: false
  end
end
