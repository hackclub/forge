class AddHcbGrantFieldsToShopItems < ActiveRecord::Migration[8.1]
  def change
    add_column :shop_items, :hcb_purpose, :string, limit: 30
    add_column :shop_items, :hcb_description, :text
  end
end
