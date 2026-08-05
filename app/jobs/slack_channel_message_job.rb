class SlackChannelMessageJob < ApplicationJob
  queue_as :background

  def perform(channel:, text:)
    return if channel.blank?

    client = Slack::Web::Client.new(token: ENV.fetch("SLACK_BOT_TOKEN", nil))
    client.chat_postMessage(channel: channel, text: text)
  rescue StandardError => e
    Rails.logger.error("SlackChannelMessageJob failed: #{e.message}")
    raise
  end
end
