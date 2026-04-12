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
#  region         :string
#  review_notes   :text
#  reviewed_at    :datetime
#  status         :integer          default("pending"), not null
#  created_at     :datetime         not null
#  updated_at     :datetime         not null
#  assigned_to_id :bigint
#  project_id     :bigint
#  reviewer_id    :bigint
#  shop_item_id   :bigint
#  user_id        :bigint           not null
#
# Indexes
#
#  index_orders_on_assigned_to_id  (assigned_to_id)
#  index_orders_on_kind            (kind)
#  index_orders_on_project_id      (project_id)
#  index_orders_on_region          (region)
#  index_orders_on_reviewer_id     (reviewer_id)
#  index_orders_on_shop_item_id    (shop_item_id)
#  index_orders_on_status          (status)
#  index_orders_on_user_id         (user_id)
#
# Foreign Keys
#
#  fk_rails_...  (assigned_to_id => users.id)
#  fk_rails_...  (project_id => projects.id)
#  fk_rails_...  (reviewer_id => users.id)
#  fk_rails_...  (shop_item_id => shop_items.id)
#  fk_rails_...  (user_id => users.id)
#
require "test_helper"

class OrderTest < ActiveSupport::TestCase
  # test "the truth" do
  #   assert true
  # end
end
