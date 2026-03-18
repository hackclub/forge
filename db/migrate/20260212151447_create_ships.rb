class CreateShips < ActiveRecord::Migration[8.1]
  def change
    create_table :ships do |t|
      t.references :project, null: false, foreign_key: true
      t.references :reviewer, foreign_key: { to_table: :users }
      t.integer :status, default: 0, null: false
      t.text :feedback
      t.string :justification
      t.integer :approved_seconds
      t.string :frozen_demo_link
      t.string :frozen_repo_link
      t.text :frozen_hca_data
      t.string :frozen_screenshot

      t.timestamps
    end

    add_index :ships, :status
  end
end
