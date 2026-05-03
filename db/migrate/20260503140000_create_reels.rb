class CreateReels < ActiveRecord::Migration[8.1]
  def change
    create_table :reels do |t|
      t.references :project, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.string :kind, null: false, default: "video"
      t.string :video_url
      t.text :caption
      t.integer :duration_seconds
      t.integer :kudos_count, null: false, default: 0

      t.timestamps
    end

    add_index :reels, :created_at

    create_table :reel_kudos do |t|
      t.references :reel, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true

      t.timestamps
    end

    add_index :reel_kudos, [ :reel_id, :user_id ], unique: true
  end
end
