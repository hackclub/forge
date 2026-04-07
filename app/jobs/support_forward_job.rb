class SupportForwardJob < ApplicationJob
  queue_as :default

  def perform(slack_user_id:, channel_id:, thread_ts:, text:)
    ticket = SupportTicket.find_by(channel_id: channel_id, thread_ts: thread_ts)
    return unless ticket
    return unless ticket.bts_message_ts.present?

    user_info = slack_client.users_info(user: slack_user_id)
    profile = user_info&.user&.profile
    display_name = profile&.display_name.presence || profile&.real_name.presence || "Unknown"
    avatar_url = profile&.image_48.presence || profile&.image_72.presence

    slack_client.chat_postMessage(
      channel: ticket.bts_channel_id,
      thread_ts: ticket.bts_message_ts,
      text: text,
      username: display_name,
      icon_url: avatar_url
    )
  rescue StandardError => e
    Rails.logger.error("SupportForwardJob failed: #{e.class}: #{e.message}\n#{e.backtrace&.first(5)&.join("\n")}")
  end

  private

  def slack_client
    @slack_client ||= Slack::Web::Client.new(token: ENV.fetch("SLACK_BOT_TOKEN", nil))
  end
end
