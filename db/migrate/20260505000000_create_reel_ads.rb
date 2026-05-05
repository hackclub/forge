class CreateReelAds < ActiveRecord::Migration[8.1]
  def change
    create_table :reel_ads do |t|
      t.string :title, null: false
      t.string :video_url, null: false
      t.string :click_url
      t.integer :duration_seconds
      t.boolean :enabled, null: false, default: true
      t.integer :impressions_count, null: false, default: 0
      t.integer :clicks_count, null: false, default: 0

      t.timestamps
    end

    add_index :reel_ads, :enabled
  end
end
