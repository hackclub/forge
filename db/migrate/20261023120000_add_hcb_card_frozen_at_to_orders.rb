class AddHcbCardFrozenAtToOrders < ActiveRecord::Migration[8.1]
  def change
    add_column :orders, :hcb_card_frozen_at, :datetime
  end
end
