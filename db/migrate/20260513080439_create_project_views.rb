class CreateProjectViews < ActiveRecord::Migration[8.1]
  def change
    create_table :project_views do |t|
      t.references :project, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true

      t.timestamps
    end

    add_index :project_views, [ :project_id, :user_id ], unique: true
  end
end
