# == Schema Information
#
# Table name: shop_item_regions
#
#  id           :bigint           not null, primary key
#  coin_cost    :decimal(10, 2)   not null
#  enabled      :boolean          default(TRUE), not null
#  region       :string           not null
#  created_at   :datetime         not null
#  updated_at   :datetime         not null
#  shop_item_id :bigint           not null
#
# Indexes
#
#  index_shop_item_regions_on_region                   (region)
#  index_shop_item_regions_on_shop_item_id             (shop_item_id)
#  index_shop_item_regions_on_shop_item_id_and_region  (shop_item_id,region) UNIQUE
#
# Foreign Keys
#
#  fk_rails_...  (shop_item_id => shop_items.id)
#
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
