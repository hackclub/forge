class SlackNotifyJob < ApplicationJob
  queue_as :default

  def perform(channel_id:, thread_ts:, text:)
    client = Slack::Web::Client.new(token: ENV.fetch("SLACK_BOT_TOKEN", nil))
    client.chat_postMessage(channel: channel_id, thread_ts: thread_ts, text: text)
  rescue StandardError => e
    Rails.logger.error("SlackNotifyJob failed: #{e.message}")
  end
end
