class OrderDmJob < ApplicationJob
  queue_as :default

  def perform(order_id)
    order = Order.includes(:user, :shop_item).find_by(id: order_id)
    return unless order&.user&.slack_id.present?

    text = self.class.message_for(order)
    return unless text

    slack_client.chat_postMessage(channel: order.user.slack_id, text: text, unfurl_links: false, unfurl_media: false)
  rescue StandardError => e
    Rails.logger.error("OrderDmJob failed: #{e.class}: #{e.message}")
  end

  def self.message_for(order)
    greeting = "Hey #{escape(order.user.display_name)}, your order for #{escape(order.kind_label)}"

    if order.rejected?
      [
        "#{greeting} was rejected:",
        order.review_notes.to_s.lines.map { |line| "> #{escape(line.chomp)}" }.join("\n"),
        help_line
      ].join("\n")
    elsif order.fulfilled?
      [
        "#{greeting} was fulfilled:",
        order.hcb_grant_link.present? ? "*HCB Grant:* #{order.hcb_grant_link}" : "The item will be shipped to you.",
        help_line
      ].join("\n")
    end
  end

  def self.help_line
    channel_id = ENV.fetch("SLACK_SUPPORT_CHANNEL_ID", "")
    channel = channel_id.present? ? "<##{channel_id}>" : "#forge-help"
    "Please ask in #{channel} for any questions!"
  end

  def self.escape(text)
    text.to_s.gsub("&", "&amp;").gsub("<", "&lt;").gsub(">", "&gt;")
  end

  private

  def slack_client
    @slack_client ||= Slack::Web::Client.new(token: ENV.fetch("SLACK_BOT_TOKEN", nil))
  end
end
