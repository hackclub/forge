class SupportRelayJob < ApplicationJob
  queue_as :default

  def perform(slack_user_id:, channel_id:, thread_ts:, text:)
    return unless text.start_with?("!")

    ticket = SupportTicket.find_by(bts_message_ts: thread_ts)
    return unless ticket

    public_text = text.sub(/\A!\s*/, "")
    return if public_text.blank?

    user_info = slack_client.users_info(user: slack_user_id)
    profile = user_info&.user&.profile
    display_name = profile&.display_name.presence || profile&.real_name.presence || "Support"
    avatar_url = profile&.image_48.presence || profile&.image_72.presence

    slack_client.chat_postMessage(
      channel: ticket.channel_id,
      thread_ts: ticket.thread_ts,
      text: public_text,
      username: display_name,
      icon_url: avatar_url
    )
  rescue StandardError => e
    Rails.logger.error("SupportRelayJob failed: #{e.class}: #{e.message}\n#{e.backtrace&.first(5)&.join("\n")}")
  end

  private

  def slack_client
    @slack_client ||= Slack::Web::Client.new(token: ENV.fetch("SLACK_BOT_TOKEN", nil))
  end
end
