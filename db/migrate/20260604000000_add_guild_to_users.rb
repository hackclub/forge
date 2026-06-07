class AddGuildToUsers < ActiveRecord::Migration[8.1]
  def change
    add_column :users, :guild, :integer
    add_index :users, :guild
  end
end
