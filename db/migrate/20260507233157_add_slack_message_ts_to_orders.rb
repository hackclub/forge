class AddSlackMessageTsToOrders < ActiveRecord::Migration[8.1]
  def change
    add_column :orders, :slack_message_ts, :string
    add_index :orders, :slack_message_ts
  end
end
