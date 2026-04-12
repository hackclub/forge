class ShopController < ApplicationController
  def index
    eligible_projects = current_user.projects.kept
      .where(status: %i[approved build_pending build_approved])
      .order(updated_at: :desc)

    orders = current_user.orders.includes(:project, :shop_item).order(created_at: :desc)
    user_region = current_user.region || "rest_of_world"
    items = ShopItem.enabled.includes(:shop_item_regions).order(:coin_cost, :name)
                    .select { |i| i.enabled_for_region?(user_region) }

    render inertia: "Shop/Index", props: {
      regions: HasRegion::REGIONS,
      user_region: user_region,
      balance: {
        balance: current_user.coin_balance,
        earned: current_user.coins_earned.round(2),
        spent: current_user.coins_spent.round(2)
      },
      can_buy_shop_items: current_user.can_buy_shop_items?,
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
      orders: orders.map { |o| serialize_order(o) },
      transactions: CoinHistory.new(current_user).serialize.map { |t|
        { date: t[:date], type: t[:type], amount: t[:amount], label: t[:label] }
      },
      direct_grant_ratio: Order::DIRECT_GRANT_RATIO
    }
  end

  def create
    kind = params[:kind].to_s

    case kind
    when "direct_grant"
      create_direct_grant
    when "shop_item"
      create_shop_item_order
    else
      redirect_to shop_path, alert: "Invalid order type."
    end
  end

  def update_region
    region = params[:region].to_s
    unless HasRegion::REGION_KEYS.include?(region)
      redirect_to shop_path, alert: "Invalid region."
      return
    end

    current_user.update!(region: region)
    Rails.cache.delete("user/#{current_user.id}")
    redirect_to shop_path
  end

  private

  def create_direct_grant
    amount = params[:amount_usd].to_f
    project = current_user.projects.kept.find_by(id: params[:project_id])

    if project.nil?
      redirect_to shop_path, alert: "Pick one of your projects."
      return
    end

    if amount <= 0
      redirect_to shop_path, alert: "Amount must be greater than zero."
      return
    end

    coin_cost = Order.direct_grant_cost(amount)
    if coin_cost > current_user.coin_balance
      redirect_to shop_path, alert: "Not enough steel coins. You have #{current_user.coin_balance}c, this costs #{coin_cost}c."
      return
    end

    order = current_user.orders.build(
      kind: "direct_grant",
      project: project,
      amount_usd: amount,
      coin_cost: coin_cost,
      description: params[:description].to_s.strip.presence
    )

    if order.save
      audit!("order.created", target: order, label: "Direct grant for #{project.name}", metadata: { kind: "direct_grant", amount_usd: amount, coin_cost: coin_cost, project_id: project.id })
      redirect_to shop_path, notice: "Order placed. Awaiting staff review."
    else
      redirect_to shop_path, alert: order.errors.full_messages.join(", ")
    end
  end

  def create_shop_item_order
    user_region = current_user.region || "rest_of_world"
    item = ShopItem.enabled.includes(:shop_item_regions).find_by(id: params[:shop_item_id])

    if item.nil? || !item.enabled_for_region?(user_region)
      redirect_to shop_path, alert: "That item isn't available in your region."
      return
    end

    unless current_user.can_buy_shop_items?
      redirect_to shop_path, alert: "Mark a project as built before spending coins on shop items."
      return
    end

    quantity = params[:quantity].to_i
    quantity = 1 if quantity < 1

    if item.max_quantity.present? && quantity > item.max_quantity
      redirect_to shop_path, alert: "You can only buy up to #{item.max_quantity} of #{item.name}."
      return
    end

    region_cost = item.coin_cost_for_region(user_region)
    total_cost = (region_cost * quantity).round(2)
    if total_cost > current_user.coin_balance
      redirect_to shop_path, alert: "Not enough steel coins. Need #{total_cost}c, have #{current_user.coin_balance}c."
      return
    end

    order = current_user.orders.build(
      kind: "shop_item",
      shop_item: item,
      quantity: quantity,
      coin_cost: total_cost,
      region: user_region,
      description: params[:description].to_s.strip.presence
    )

    if order.save
      audit!("order.created", target: order, label: item.name, metadata: { kind: "shop_item", shop_item_id: item.id, quantity: quantity, coin_cost: total_cost })
      redirect_to shop_path, notice: "Order placed for #{quantity}× #{item.name}. Awaiting staff review."
    else
      redirect_to shop_path, alert: order.errors.full_messages.join(", ")
    end
  end

  def serialize_order(order)
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
