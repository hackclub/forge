class SupportRelayJob < ApplicationJob
  queue_as :default

  def perform(slack_user_id:, channel_id:, thread_ts:, text:)
    ticket = SupportTicket.find_by(bts_message_ts: thread_ts)
    return unless ticket

    stripped = text.strip

    if stripped == "?resolve"
      handle_resolve(ticket, slack_user_id)
      return
    elsif stripped == "?open"
      handle_reopen(ticket, slack_user_id)
      return
    end

    return unless stripped.start_with?("!")

    public_text = stripped.sub(/\A!\s*/, "")
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

  def handle_resolve(ticket, slack_user_id)
    return if ticket.resolved?

    user_info = slack_client.users_info(user: slack_user_id)
    display_name = user_info&.user&.profile&.display_name.presence || user_info&.user&.profile&.real_name.presence || "Support"

    ticket.update!(
      status: :resolved,
      resolved_by_slack_id: slack_user_id,
      resolved_by_name: display_name,
      resolved_at: Time.current
    )

    slack_client.chat_postMessage(
      channel: ticket.channel_id,
      thread_ts: ticket.thread_ts,
      text: ":white_check_mark: <@#{ticket.slack_user_id}> This question has been marked as resolved by <@#{slack_user_id}>!"
    )
    slack_client.reactions_add(channel: ticket.channel_id, timestamp: ticket.thread_ts, name: "white_check_mark")
    update_bts_message(ticket)

    slack_client.chat_postMessage(
      channel: ticket.bts_channel_id,
      thread_ts: ticket.bts_message_ts,
      text: ":white_check_mark: Ticket resolved by <@#{slack_user_id}>"
    )
  end

  def handle_reopen(ticket, slack_user_id)
    return unless ticket.resolved?

    ticket.update!(status: :open, resolved_by_slack_id: nil, resolved_by_name: nil, resolved_at: nil)
    update_bts_message(ticket)

    slack_client.reactions_remove(channel: ticket.channel_id, timestamp: ticket.thread_ts, name: "white_check_mark")
    slack_client.chat_postMessage(
      channel: ticket.bts_channel_id,
      thread_ts: ticket.bts_message_ts,
      text: ":arrows_counterclockwise: Ticket reopened by <@#{slack_user_id}>"
    )
  rescue Slack::Web::Api::Errors::NoReaction
    # reaction wasn't there, that's fine
  end

  def update_bts_message(ticket)
    return unless ticket.bts_message_ts.present?

    blocks = SupportTicketJob.bts_blocks(ticket)
    slack_client.chat_update(
      channel: ticket.bts_channel_id,
      ts: ticket.bts_message_ts,
      blocks: blocks,
      text: "Support ticket from #{ticket.slack_display_name}"
    )
  end

  def slack_client
    @slack_client ||= Slack::Web::Client.new(token: ENV.fetch("SLACK_BOT_TOKEN", nil))
  end
end
