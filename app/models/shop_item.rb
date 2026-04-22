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
class ShopItem < ApplicationRecord
  include HasRegion

  has_paper_trail

  has_many :orders, dependent: :nullify
  has_many :shop_item_regions, dependent: :destroy
  accepts_nested_attributes_for :shop_item_regions, allow_destroy: true

  validates :name, presence: true
  validates :coin_cost, numericality: { greater_than: 0 }
  validates :max_quantity, numericality: { only_integer: true, greater_than: 0 }, allow_nil: true

  scope :enabled, -> { where(enabled: true) }
  scope :sorted, -> { order(:name) }

  def coin_cost_for_region(region)
    shop_item_regions.find { |sir| sir.region == region }&.coin_cost || coin_cost
  end

  def enabled_for_region?(region)
    sir = shop_item_regions.find { |s| s.region == region }
    sir ? sir.enabled : enabled
  end

  after_create_commit :notify_slack_created
  after_update_commit :notify_slack_price_changed

  private

  def notify_slack_created
    SlackShopUpdateJob.perform_later(id, "created")
  end

  def notify_slack_price_changed
    return unless saved_change_to_coin_cost?

    SlackShopUpdateJob.perform_later(id, "price_changed")
  end
end
