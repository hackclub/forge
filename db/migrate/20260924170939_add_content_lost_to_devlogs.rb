class AddContentLostToDevlogs < ActiveRecord::Migration[8.1]
  def up
    add_column :devlogs, :content_lost, :boolean, default: false, null: false
    execute "UPDATE devlogs SET content_lost = true WHERE content ILIKE '%database mishap%'"
  end

  def down
    remove_column :devlogs, :content_lost
  end
end
