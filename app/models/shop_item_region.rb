class ShopItemRegion < ApplicationRecord
  include HasRegion

  belongs_to :shop_item

  validates :region, presence: true, inclusion: { in: REGION_KEYS }
  validates :region, uniqueness: { scope: :shop_item_id }
  validates :coin_cost, numericality: { greater_than: 0 }

  after_save :notify_shop_item_updated, if: :saved_change_to_coin_cost?

  private

  def notify_shop_item_updated
    SlackShopUpdateJob.perform_later(shop_item_id, "price_changed")
  end
end
