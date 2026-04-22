class CreateKudos < ActiveRecord::Migration[8.1]
  def change
    create_table :kudos do |t|
      t.references :user, null: false, foreign_key: true
      t.references :author, null: false, foreign_key: { to_table: :users }
      t.text :content, null: false

      t.timestamps
    end
  end
end
