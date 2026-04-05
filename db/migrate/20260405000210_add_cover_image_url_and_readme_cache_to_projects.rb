class AddCoverImageUrlAndReadmeCacheToProjects < ActiveRecord::Migration[8.1]
  def change
    add_column :projects, :cover_image_url, :string
    add_column :projects, :readme_cache, :text
    add_column :projects, :readme_fetched_at, :datetime
  end
end
