class AddHackatimeBannedAtToUsers < ActiveRecord::Migration[8.1]
  def change
    add_column :users, :hackatime_banned_at, :datetime
    add_index :users, :hackatime_banned_at
  end
end
