class CreateOrphanedLapseLinks < ActiveRecord::Migration[8.1]
  def change
    create_table :orphaned_lapse_links do |t|
      t.references :project, null: false, foreign_key: true
      t.string :title, null: false
      t.string :lapse_url, null: false
      t.timestamps
    end
  end
end
