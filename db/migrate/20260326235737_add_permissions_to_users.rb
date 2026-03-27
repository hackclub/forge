class AddPermissionsToUsers < ActiveRecord::Migration[8.1]
  def change
    add_column :users, :permissions, :string, array: true, default: [], null: false
  end
end
