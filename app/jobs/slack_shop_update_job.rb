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
    lines = []
    if event == "price_changed"
      lines << ":moneybag: *Price updated*"
    else
      lines << "<!here>"
    end
    lines << "*#{item.name}*"
    lines << item.description if item.description.present?
    lines << "Base cost: #{format_cost(item.coin_cost)} Coins"
    lines << region_pricing_line(item) if item.shop_item_regions.any?

    blocks = [
      { type: "section", text: { type: "mrkdwn", text: lines.join("\n") } }
    ]
    if item.image_url.present?
      blocks << { type: "image", image_url: item.image_url, alt_text: item.name }
    end
    blocks
  end

  def region_pricing_line(item)
    parts = item.shop_item_regions.sort_by { |r| HasRegion::REGION_KEYS.index(r.region) || 99 }.map { |r|
      status = r.enabled ? "#{format_cost(r.coin_cost)}c" : "unavailable"
      "#{HasRegion::REGIONS[r.region]}: #{status}"
    }
    parts.join(" · ")
  end

  def format_cost(cost)
    cost.to_d == cost.to_i ? cost.to_i.to_s : cost.to_s
  end
end
