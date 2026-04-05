class CreateRsvps < ActiveRecord::Migration[8.1]
  def change
    create_table :rsvps do |t|
      t.string :email, null: false

      t.timestamps
    end
    add_index :rsvps, :email, unique: true
  end
end
