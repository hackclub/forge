module ShopProps
  extend ActiveSupport::Concern

  private

  def shop_props
    user_region = current_user&.region || "rest_of_world"
    items = ShopItem.enabled.includes(:shop_item_regions)
                    .select { |i| i.enabled_for_region?(user_region) }
                    .sort_by { |i| [ i.coin_cost_for_region(user_region), i.name ] }

    eligible_projects = current_user ? current_user.projects.kept.approved.order(updated_at: :desc) : []
    orders = current_user ? current_user.orders.includes(:project, :shop_item).order(created_at: :desc) : []

    {
      regions: HasRegion::REGIONS,
      user_region: user_region,
      balance: {
        balance: current_user&.coin_balance || 0,
        earned: current_user&.coins_earned&.round(2) || 0,
        spent: current_user&.coins_spent&.round(2) || 0
      },
      streak_freezes: {
        owned: current_user&.streak_freezes || 0,
        cost: User::STREAK_FREEZE_COST
      },
      can_buy_shop_items: current_user&.can_buy_shop_items? || false,
      eligible_projects: eligible_projects.map { |p|
        {
          id: p.id,
          name: p.name,
          tier: p.tier,
          coin_rate: p.coin_rate,
          coins_earned: p.coins_earned,
          total_hours: p.total_hours.round(2),
          built: p.built?,
          built_at: p.built_at&.strftime("%b %d, %Y")
        }
      },
      shop_items: items.map { |i|
        {
          id: i.id,
          name: i.name,
          description: i.description,
          image_url: i.image_url,
          coin_cost: i.coin_cost_for_region(user_region).to_f,
          max_quantity: i.max_quantity
        }
      },
      orders: orders.map { |o| serialize_shop_order(o) },
      transactions: current_user ? CoinHistory.new(current_user).serialize.map { |t|
        { date: t[:date], type: t[:type], amount: t[:amount], label: t[:label] }
      } : [],
      direct_grant_ratio: Order::DIRECT_GRANT_RATIO
    }
  end

  def serialize_shop_order(order)
    {
      id: order.id,
      kind: order.kind,
      kind_label: order.kind_label,
      status: order.status,
      quantity: order.quantity,
      amount_usd: order.amount_usd&.to_f,
      coin_cost: order.coin_cost.to_f,
      description: order.description,
      project_name: order.project&.name,
      shop_item_name: order.shop_item&.name,
      shop_item_image: order.shop_item&.image_url,
      hcb_grant_link: order.hcb_grant_link,
      created_at: order.created_at.strftime("%b %d, %Y")
    }
  end
end
