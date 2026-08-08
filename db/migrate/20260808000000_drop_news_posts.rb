class DropNewsPosts < ActiveRecord::Migration[8.1]
  def up
    drop_table :news_posts
  end

  def down
    create_table :news_posts do |t|
      t.bigint :author_id, null: false
      t.text :body, null: false
      t.boolean :published, default: false, null: false
      t.datetime :published_at
      t.string :title, null: false
      t.timestamps
      t.index :author_id
      t.index [ :published, :published_at ]
    end
  end
end
