class ShopItemRegion < ApplicationRecord
  include HasRegion

  belongs_to :shop_item

  validates :region, presence: true, inclusion: { in: REGION_KEYS }
  validates :region, uniqueness: { scope: :shop_item_id }
  validates :coin_cost, numericality: { greater_than: 0 }
end
