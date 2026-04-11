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
  has_paper_trail

  has_many :orders, dependent: :nullify

  validates :name, presence: true
  validates :coin_cost, numericality: { greater_than: 0 }
  validates :max_quantity, numericality: { only_integer: true, greater_than: 0 }, allow_nil: true

  scope :enabled, -> { where(enabled: true) }
  scope :sorted, -> { order(:name) }
end
