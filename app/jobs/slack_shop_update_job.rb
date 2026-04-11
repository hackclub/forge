class SlackShopUpdateJob < ApplicationJob
  queue_as :default

  def perform(shop_item_id, event)
    channel_id = ENV.fetch("SLACK_SHOP_UPDATES_CHANNEL_ID", nil)
    return if channel_id.blank?

    item = ShopItem.find_by(id: shop_item_id)
    return unless item

    client = Slack::Web::Client.new(token: ENV.fetch("SLACK_BOT_TOKEN", nil))
    client.chat_postMessage(
      channel: channel_id,
      text: fallback_text(item, event),
      blocks: build_blocks(item, event),
      link_names: true
    )
  rescue StandardError => e
    Rails.logger.error("SlackShopUpdateJob failed: #{e.message}")
  end

  private

  def fallback_text(item, event)
    prefix = event == "price_changed" ? "Price updated: " : ""
    "#{prefix}#{item.name} — #{format_cost(item.coin_cost)} Coins"
  end

  def build_blocks(item, event)
    lines = [ "<!channel>" ]
    lines << ":moneybag: *Price updated*" if event == "price_changed"
    lines << "*#{item.name}*"
    lines << item.description if item.description.present?
    lines << "Cost: #{format_cost(item.coin_cost)} Coins"

    blocks = [
      { type: "section", text: { type: "mrkdwn", text: lines.join("\n") } }
    ]
    if item.image_url.present?
      blocks << { type: "image", image_url: item.image_url, alt_text: item.name }
    end
    blocks
  end

  def format_cost(cost)
    cost.to_d == cost.to_i ? cost.to_i.to_s : cost.to_s
  end
end
