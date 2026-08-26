class AddTimezoneManuallySetToUsers < ActiveRecord::Migration[8.0]
  def change
    add_column :users, :timezone_manually_set, :boolean, default: false, null: false
  end
end
