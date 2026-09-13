class AddFulfillmentMethodToOrders < ActiveRecord::Migration[8.1]
  def change
    add_column :orders, :fulfillment_method, :string
  end
end
