class ShopController < ApplicationController
  include ShopProps

  allow_unauthenticated_access only: %i[index]

  def index
    render inertia: "Shop/Index", props: shop_props
  end

  def create
    kind = params[:kind].to_s

    case kind
    when "direct_grant"
      create_direct_grant
    when "shop_item"
      create_shop_item_order
    when "streak_freeze"
      create_streak_freeze
    else
      redirect_back fallback_location: shop_path, alert: "Invalid order type."
    end
  end

  def update_region
    region = params[:region].to_s
    unless HasRegion::REGION_KEYS.include?(region)
      redirect_back fallback_location: shop_path, alert: "Invalid region."
      return
    end

    current_user.update!(region: region)
    Rails.cache.delete("user/#{current_user.id}")
    redirect_back fallback_location: shop_path
  end

  private

  def create_direct_grant
    amount = params[:amount_usd].to_f
    project = current_user.projects.kept.find_by(id: params[:project_id])

    if project.nil?
      redirect_back fallback_location: shop_path, alert: "Pick one of your projects."
      return
    end

    if amount <= 0
      redirect_back fallback_location: shop_path, alert: "Amount must be greater than zero."
      return
    end

    coin_cost = Order.direct_grant_cost(amount)
    if coin_cost > current_user.coin_balance
      redirect_back fallback_location: shop_path, alert: "Not enough steel coins. You have #{current_user.coin_balance}c, this costs #{coin_cost}c."
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
      redirect_back fallback_location: shop_path, notice: "Order placed. Awaiting staff review."
    else
      redirect_back fallback_location: shop_path, alert: order.errors.full_messages.join(", ")
    end
  end

  def create_shop_item_order
    user_region = current_user.region || "rest_of_world"
    item = ShopItem.enabled.includes(:shop_item_regions).find_by(id: params[:shop_item_id])

    if item.nil? || !item.enabled_for_region?(user_region)
      redirect_back fallback_location: shop_path, alert: "That item isn't available in your region."
      return
    end

    unless current_user.can_buy_shop_items?
      redirect_back fallback_location: shop_path, alert: "Mark a project as built before spending coins on shop items."
      return
    end

    quantity = params[:quantity].to_i
    quantity = 1 if quantity < 1

    if item.max_quantity.present? && quantity > item.max_quantity
      redirect_back fallback_location: shop_path, alert: "You can only buy up to #{item.max_quantity} of #{item.name}."
      return
    end

    region_cost = item.coin_cost_for_region(user_region)
    total_cost = (region_cost * quantity).round(2)
    if total_cost > current_user.coin_balance
      redirect_back fallback_location: shop_path, alert: "Not enough steel coins. Need #{total_cost}c, have #{current_user.coin_balance}c."
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
      redirect_back fallback_location: shop_path, notice: "Order placed for #{quantity}× #{item.name}. Awaiting staff review."
    else
      redirect_back fallback_location: shop_path, alert: order.errors.full_messages.join(", ")
    end
  end

  def create_streak_freeze
    quantity = params[:quantity].to_i
    quantity = 1 if quantity < 1
    total_cost = User::STREAK_FREEZE_COST * quantity

    if total_cost > current_user.coin_balance
      redirect_back fallback_location: shop_path, alert: "Not enough steel coins. Need #{total_cost}c, have #{current_user.coin_balance}c."
      return
    end

    User.transaction do
      current_user.coin_adjustments.create!(
        amount: -total_cost,
        reason: quantity > 1 ? "Streak freeze purchase (×#{quantity})" : "Streak freeze purchase",
        actor: current_user
      )
      current_user.increment!(:streak_freezes, quantity)
    end

    current_user.apply_streak_freezes!
    audit!("streak_freeze.purchased", target: current_user, label: "Streak freeze ×#{quantity}", metadata: { quantity: quantity, coin_cost: total_cost })
    redirect_back fallback_location: shop_path, notice: "Purchased #{quantity} streak freeze#{'s' if quantity > 1}."
  rescue ActiveRecord::RecordInvalid => e
    redirect_back fallback_location: shop_path, alert: e.message
  end
end
