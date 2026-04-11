# == Schema Information
#
# Table name: orders
#
#  id             :bigint           not null, primary key
#  amount_usd     :decimal(10, 2)
#  coin_cost      :decimal(10, 2)   not null
#  description    :text
#  fulfilled_at   :datetime
#  hcb_grant_link :string
#  kind           :string           not null
#  quantity       :integer          default(1), not null
#  review_notes   :text
#  reviewed_at    :datetime
#  status         :integer          default("pending"), not null
#  created_at     :datetime         not null
#  updated_at     :datetime         not null
#  project_id     :bigint
#  reviewer_id    :bigint
#  shop_item_id   :bigint
#  user_id        :bigint           not null
#
# Indexes
#
#  index_orders_on_kind          (kind)
#  index_orders_on_project_id    (project_id)
#  index_orders_on_reviewer_id   (reviewer_id)
#  index_orders_on_shop_item_id  (shop_item_id)
#  index_orders_on_status        (status)
#  index_orders_on_user_id       (user_id)
#
# Foreign Keys
#
#  fk_rails_...  (project_id => projects.id)
#  fk_rails_...  (reviewer_id => users.id)
#  fk_rails_...  (shop_item_id => shop_items.id)
#  fk_rails_...  (user_id => users.id)
#
class Order < ApplicationRecord
  has_paper_trail

  KINDS = %w[direct_grant shop_item].freeze
  DIRECT_GRANT_RATIO = 1.0

  belongs_to :user
  belongs_to :project, optional: true
  belongs_to :shop_item, optional: true
  belongs_to :reviewer, class_name: "User", optional: true

  enum :status, { pending: 0, approved: 1, fulfilled: 2, rejected: 3 }

  validates :kind, inclusion: { in: KINDS }
  validates :coin_cost, numericality: { greater_than: 0 }
  validates :quantity, numericality: { only_integer: true, greater_than: 0 }
  validates :amount_usd, numericality: { greater_than: 0 }, if: :direct_grant?
  validate :direct_grant_must_have_owned_project
  validate :shop_item_must_be_present

  scope :open, -> { where(status: %i[pending approved]) }

  def direct_grant?
    kind == "direct_grant"
  end

  def shop_item?
    kind == "shop_item"
  end

  def kind_label
    direct_grant? ? "Direct project grant" : (shop_item&.name || "Shop item")
  end

  def self.direct_grant_cost(amount_usd)
    (amount_usd.to_f * DIRECT_GRANT_RATIO).round(2)
  end

  private

  def direct_grant_must_have_owned_project
    return unless direct_grant?

    if project_id.blank?
      errors.add(:project_id, "is required for a direct grant")
    elsif project && project.user_id != user_id
      errors.add(:project_id, "must be one of your own projects")
    end
  end

  def shop_item_must_be_present
    return unless shop_item?

    errors.add(:shop_item_id, "is required") if shop_item_id.blank?
  end
end
