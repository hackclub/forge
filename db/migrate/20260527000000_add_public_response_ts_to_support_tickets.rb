class AddPublicResponseTsToSupportTickets < ActiveRecord::Migration[8.1]
  def change
    add_column :support_tickets, :public_response_ts, :string
    add_index :support_tickets, :public_response_ts
  end
end
