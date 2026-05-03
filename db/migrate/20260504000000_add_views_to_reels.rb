class AddViewsToReels < ActiveRecord::Migration[8.1]
  def change
    add_column :reels, :views_count, :integer, default: 0, null: false

    create_table :reel_views do |t|
      t.references :reel, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true

      t.timestamps
    end

    add_index :reel_views, [ :reel_id, :user_id ], unique: true
  end
end
