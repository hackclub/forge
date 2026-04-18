class CreateProjectNotes < ActiveRecord::Migration[8.1]
  def change
    create_table :project_notes do |t|
      t.text :content, null: false
      t.references :project, null: false, foreign_key: true
      t.references :author, null: false, foreign_key: { to_table: :users }

      t.timestamps
    end
  end
end
