class AddNdaBypassToUsers < ActiveRecord::Migration[8.1]
  def change
    add_column :users, :nda_bypass, :boolean, default: false, null: false
  end
end
