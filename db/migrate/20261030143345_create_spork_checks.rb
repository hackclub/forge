class CreateSporkChecks < ActiveRecord::Migration[8.1]
  def change
    create_table :spork_checks do |t|
      t.references :project, null: false, foreign_key: true, index: { unique: true }
      t.string :repo
      t.string :verdict
      t.integer :match_count, null: false, default: 0
      t.jsonb :results, null: false, default: []
      t.jsonb :screen_errors, null: false, default: []
      t.text :error_message
      t.datetime :checked_at

      t.timestamps
    end
    add_index :spork_checks, :verdict
  end
end
