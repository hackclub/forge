class CreateDevlogs < ActiveRecord::Migration[8.1]
  def change
    create_table :devlogs do |t|
      t.references :project, null: false, foreign_key: true
      t.text :content
      t.string :title
      t.string :time_spent

      t.timestamps
    end
  end
end
