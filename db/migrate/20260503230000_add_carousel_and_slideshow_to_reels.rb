class AddCarouselAndSlideshowToReels < ActiveRecord::Migration[8.1]
  def change
    add_column :reels, :audio_url, :string

    create_table :reel_images do |t|
      t.references :reel, null: false, foreign_key: true
      t.string :image_url, null: false
      t.integer :position, null: false, default: 0

      t.timestamps
    end

    add_index :reel_images, [ :reel_id, :position ]
  end
end
