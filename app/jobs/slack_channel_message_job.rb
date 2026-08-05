class SlackChannelMessageJob < ApplicationJob
  queue_as :background

  def perform(channel:, text:)
    return if channel.blank?

    client = Slack::Web::Client.new(token: ENV.fetch("SLACK_BOT_TOKEN", nil))
    begin
      client.conversations_join(channel: channel)
    rescue Slack::Web::Api::Errors::SlackError
      nil
    end
    client.chat_postMessage(channel: channel, text: text)
  rescue StandardError => e
    Rails.logger.error("SlackChannelMessageJob failed: #{e.message}")
    raise
  end
end
