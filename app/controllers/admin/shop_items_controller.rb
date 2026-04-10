class Admin::ShopItemsController < Admin::ApplicationController
  before_action :require_orders_permission!

  def index
    items = ShopItem.order(:name)

    render inertia: "Admin/ShopItems/Index", props: {
      items: items.map { |i| serialize_item(i) }
    }
  end

  def create
    item = ShopItem.new(item_params)

    if item.save
      audit!("shop_item.created", target: item, metadata: { name: item.name, coin_cost: item.coin_cost.to_f })
      redirect_to admin_shop_items_path, notice: "Item '#{item.name}' added."
    else
      redirect_to admin_shop_items_path, alert: item.errors.full_messages.join(", ")
    end
  end

  def update
    item = ShopItem.find(params[:id])

    if item.update(item_params)
      audit!("shop_item.updated", target: item, metadata: { name: item.name, coin_cost: item.coin_cost.to_f })
      redirect_to admin_shop_items_path, notice: "Item updated."
    else
      redirect_to admin_shop_items_path, alert: item.errors.full_messages.join(", ")
    end
  end

  def destroy
    item = ShopItem.find(params[:id])
    audit!("shop_item.destroyed", target: item, label: item.name, metadata: { name: item.name })
    item.destroy
    redirect_to admin_shop_items_path, notice: "Item deleted."
  end

  private

  def require_orders_permission!
    require_permission!("orders")
  end

  def item_params
    params.expect(shop_item: [ :name, :description, :image_url, :coin_cost, :enabled, :internal_order_link, :internal_price_usd ])
  end

  def serialize_item(item)
    {
      id: item.id,
      name: item.name,
      description: item.description,
      image_url: item.image_url,
      coin_cost: item.coin_cost.to_f,
      enabled: item.enabled,
      internal_order_link: item.internal_order_link,
      internal_price_usd: item.internal_price_usd&.to_f
    }
  end
end
