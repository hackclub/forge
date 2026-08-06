class AddCreatedAtIndexToDevlogs < ActiveRecord::Migration[8.1]
  def change
    add_index :devlogs, :created_at
  end
end
