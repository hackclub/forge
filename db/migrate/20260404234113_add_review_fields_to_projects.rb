class AddReviewFieldsToProjects < ActiveRecord::Migration[8.1]
  def change
    add_column :projects, :cover_image_url, :string
    add_column :projects, :override_hours, :decimal
    add_column :projects, :override_hours_justification, :text
  end
end
