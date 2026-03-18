class CreateProjects < ActiveRecord::Migration[8.1]
  def change
    create_table :projects do |t|
      t.references :user, null: false, foreign_key: true
      t.string :name, null: false
      t.text :description
      t.string :demo_link
      t.string :repo_link
      t.string :tags, array: true, default: [], null: false
      t.boolean :is_unlisted, default: false, null: false

      t.timestamps
    end

    add_index :projects, :tags, using: :gin
    add_index :projects, :is_unlisted
  end
end
