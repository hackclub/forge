class ShopController < ApplicationController
  def index
    eligible_projects = current_user.projects.kept
      .where(status: %i[approved build_pending build_approved])
      .order(updated_at: :desc)

    orders = current_user.orders.includes(:project, :shop_item).order(created_at: :desc)
    items = ShopItem.enabled.sorted

    render inertia: "Shop/Index", props: {
      balance: {
        balance: current_user.coin_balance,
        earned: current_user.coins_earned.round(2),
        spent: current_user.coins_spent.round(2)
      },
      can_buy_shop_items: current_user.has_built_project?,
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
          coin_cost: i.coin_cost.to_f
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
    item = ShopItem.enabled.find_by(id: params[:shop_item_id])

    if item.nil?
      redirect_to shop_path, alert: "That item isn't available."
      return
    end

    unless current_user.has_built_project?
      redirect_to shop_path, alert: "Mark a project as built before spending coins on shop items."
      return
    end

    if item.coin_cost > current_user.coin_balance
      redirect_to shop_path, alert: "Not enough steel coins."
      return
    end

    order = current_user.orders.build(
      kind: "shop_item",
      shop_item: item,
      coin_cost: item.coin_cost,
      description: params[:description].to_s.strip.presence
    )

    if order.save
      audit!("order.created", target: order, label: item.name, metadata: { kind: "shop_item", shop_item_id: item.id, coin_cost: item.coin_cost.to_f })
      redirect_to shop_path, notice: "Order placed for #{item.name}. Awaiting staff review."
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
