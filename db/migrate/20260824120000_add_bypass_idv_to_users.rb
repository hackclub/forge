class AddBypassIdvToUsers < ActiveRecord::Migration[8.0]
  def change
    add_column :users, :bypass_idv, :boolean, default: false, null: false
  end
end
