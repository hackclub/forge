class CreateSupportTickets < ActiveRecord::Migration[8.1]
  def change
    create_table :support_tickets do |t|
      t.string :slack_user_id, null: false
      t.string :slack_display_name
      t.string :slack_avatar_url

      t.string :channel_id, null: false
      t.string :thread_ts, null: false

      t.string :bts_channel_id, null: false
      t.string :bts_message_ts

      t.text :original_text, null: false

      t.integer :status, default: 0, null: false

      t.string :claimed_by_slack_id
      t.string :claimed_by_name
      t.string :resolved_by_slack_id
      t.string :resolved_by_name
      t.datetime :claimed_at
      t.datetime :resolved_at

      t.timestamps
    end

    add_index :support_tickets, :thread_ts, unique: true
    add_index :support_tickets, :bts_message_ts
    add_index :support_tickets, :status
  end
end
