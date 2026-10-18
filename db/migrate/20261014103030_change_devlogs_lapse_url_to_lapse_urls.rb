class ChangeDevlogsLapseUrlToLapseUrls < ActiveRecord::Migration[8.1]
  def up
    add_column :devlogs, :lapse_urls, :string, array: true, default: [], null: false
    execute "UPDATE devlogs SET lapse_urls = ARRAY[lapse_url] WHERE lapse_url IS NOT NULL AND lapse_url <> ''"
    remove_column :devlogs, :lapse_url
  end

  def down
    add_column :devlogs, :lapse_url, :string
    execute "UPDATE devlogs SET lapse_url = lapse_urls[1]"
    remove_column :devlogs, :lapse_urls
  end
end
