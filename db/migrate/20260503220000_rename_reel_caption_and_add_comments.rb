class RenameReelCaptionAndAddComments < ActiveRecord::Migration[8.1]
  def change
    rename_column :reels, :caption, :title

    create_table :reel_comments do |t|
      t.references :reel, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.text :body, null: false

      t.timestamps
    end

    add_index :reel_comments, :created_at
    add_column :reels, :comments_count, :integer, default: 0, null: false
  end
end
