class SlackNotifyJob < ApplicationJob
  queue_as :default

  def perform(channel_id:, thread_ts:, text:, reaction: nil)
    client = Slack::Web::Client.new(token: ENV.fetch("SLACK_BOT_TOKEN", nil))
    client.chat_postMessage(channel: channel_id, thread_ts: thread_ts, text: text)

    if reaction.present?
      %w[eyes clock1 yay x].each do |old_emoji|
        client.reactions_remove(channel: channel_id, timestamp: thread_ts, name: old_emoji)
      rescue Slack::Web::Api::Errors::NoReaction
        nil
      end
      client.reactions_add(channel: channel_id, timestamp: thread_ts, name: reaction)
    end
  rescue StandardError => e
    Rails.logger.error("SlackNotifyJob failed: #{e.message}")
  end
end
