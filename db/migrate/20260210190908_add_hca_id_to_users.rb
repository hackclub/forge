class AddHcaIdToUsers < ActiveRecord::Migration[8.1]
  def change
    add_column :users, :hca_id, :string
  end
end
