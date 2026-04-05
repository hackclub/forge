class RemoveCoverImageUrlFromProjects < ActiveRecord::Migration[8.1]
  def change
    remove_column :projects, :cover_image_url, :string
  end
end
