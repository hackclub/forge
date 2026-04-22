# == Schema Information
#
# Table name: shop_items
#
#  id                  :bigint           not null, primary key
#  coin_cost           :decimal(10, 2)   not null
#  description         :text
#  enabled             :boolean          default(TRUE), not null
#  image_url           :string
#  internal_order_link :string
#  internal_price_usd  :decimal(10, 2)
#  max_quantity        :integer
#  name                :string           not null
#  created_at          :datetime         not null
#  updated_at          :datetime         not null
#
require "test_helper"

class ShopItemTest < ActiveSupport::TestCase
  # test "the truth" do
  #   assert true
  # end
end
