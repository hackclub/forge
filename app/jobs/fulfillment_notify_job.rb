class FulfillmentNotifyJob < ApplicationJob
  queue_as :default

  def perform(order_id)
    order = Order.find_by(id: order_id)
    return unless order

    channel = ENV.fetch("SLACK_FULFILLMENT_CHANNEL_ID", "")
    return if channel.blank?

    if order.approved?
      post_or_update(order, channel)
    elsif order.slack_message_ts.present?
      remove_from_queue(order, channel)
    end
  rescue StandardError => e
    Rails.logger.error("FulfillmentNotifyJob failed: #{e.class}: #{e.message}")
  end

  def self.queue_blocks(order)
    region_label = order.region.present? ? HasRegion::REGIONS[order.region] : nil
    assignee_label = order.assigned_to ? "Assigned to *#{order.assigned_to.display_name}*" : "_Unassigned_"

    cost = if order.direct_grant?
      "$#{format('%.2f', order.amount_usd.to_f)} (#{format_coin(order.coin_cost)} Coins)"
    else
      "#{format_coin(order.coin_cost)} Coins × #{order.quantity}"
    end

    app_url = ENV.fetch("APP_URL", "https://forge.hackclub.com")
    item_link = "<#{app_url}/admin/orders/#{order.id}|#{order.kind_label}>"
    project_line = order.project ? "\nProject: *#{order.project.name}*" : ""

    meta_parts = [ region_label, assignee_label ].compact

    [
      {
        type: "context",
        elements: [
          order.user.avatar.present? ? { type: "image", image_url: order.user.avatar, alt_text: order.user.display_name.to_s } : nil,
          { type: "mrkdwn", text: "*#{order.user.display_name}*" }
        ].compact
      },
      {
        type: "section",
        text: { type: "mrkdwn", text: "#{item_link} — #{cost}#{project_line}" }
      },
      {
        type: "context",
        elements: [
          { type: "mrkdwn", text: ":package: *Awaiting fulfillment* | #{meta_parts.join(' | ')}" }
        ]
      }
    ]
  end

  def self.format_coin(amount)
    amount.to_d == amount.to_i ? amount.to_i.to_s : amount.to_s
  end

  private

  def post_or_update(order, channel)
    blocks = self.class.queue_blocks(order)
    text = "Order ##{order.id} — #{order.user.display_name}"

    if order.slack_message_ts.present?
      slack_client.chat_update(channel: channel, ts: order.slack_message_ts, blocks: blocks, text: text)
    else
      result = slack_client.chat_postMessage(channel: channel, blocks: blocks, text: text)
      order.update!(slack_message_ts: result["ts"]) if result["ok"]
    end
  end

  def remove_from_queue(order, channel)
    slack_client.chat_delete(channel: channel, ts: order.slack_message_ts)
    order.update!(slack_message_ts: nil)
  rescue StandardError => e
    Rails.logger.error("Failed to remove order ##{order.id} from fulfillment queue: #{e.message}")
    order.update!(slack_message_ts: nil)
  end

  def slack_client
    @slack_client ||= Slack::Web::Client.new(token: ENV.fetch("SLACK_BOT_TOKEN", nil))
  end
end
