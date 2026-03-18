class AddDiscardedAtToUsersAndProjects < ActiveRecord::Migration[8.1]
  def change
    add_column :users, :discarded_at, :datetime
    add_column :projects, :discarded_at, :datetime

    add_index :users, :discarded_at
    add_index :projects, :discarded_at
  end
end
