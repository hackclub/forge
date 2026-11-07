class CreateReferralPins < ActiveRecord::Migration[8.1]
  def change
    create_table :referral_pins do |t|
      t.references :user, null: false, foreign_key: true
      t.references :order, null: false, foreign_key: true
      t.integer :milestone, null: false

      t.timestamps
    end

    add_index :referral_pins, [ :user_id, :milestone ], unique: true
  end
end
