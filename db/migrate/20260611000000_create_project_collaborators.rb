class CreateProjectCollaborators < ActiveRecord::Migration[8.1]
  def change
    create_table :project_collaborators do |t|
      t.references :project, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true

      t.timestamps
    end

    add_index :project_collaborators, [ :project_id, :user_id ], unique: true
  end
end
