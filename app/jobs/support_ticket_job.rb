class SupportTicketJob < ApplicationJob
  queue_as :default

  def perform(slack_user_id:, channel_id:, message_ts:, text:)
    return if SupportTicket.exists?(thread_ts: message_ts)

    user_info = slack_client.users_info(user: slack_user_id)
    profile = user_info&.user&.profile
    display_name = profile&.display_name.presence || profile&.real_name.presence || "Unknown"
    avatar_url = profile&.image_192.presence || profile&.image_72.presence

    bts_channel = ENV.fetch("SLACK_BTS_CHANNEL_ID", "")

    ticket = SupportTicket.create!(
      slack_user_id: slack_user_id,
      slack_display_name: display_name,
      slack_avatar_url: avatar_url,
      channel_id: channel_id,
      thread_ts: message_ts,
      bts_channel_id: bts_channel,
      original_text: text.truncate(4000),
      status: :open
    )

    public_blocks = [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: ":hammer_and_wrench: *Hey builder!* We've seen your question and someone from the team will be with you soon.\n\nIn the meantime, check out <https://forge.hackclub.com/docs|the docs> — your answer might already be there!"
        }
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: { type: "plain_text", text: "Mark Answered", emoji: true },
            style: "primary",
            action_id: "support_mark_answered",
            value: ticket.id.to_s
          }
        ]
      }
    ]

    slack_client.chat_postMessage(
      channel: channel_id,
      thread_ts: message_ts,
      blocks: public_blocks,
      text: "Hey builder! We've seen your question and someone from the team will be with you soon."
    )

    bts_blocks = self.class.bts_blocks(ticket)

    result = slack_client.chat_postMessage(
      channel: bts_channel,
      blocks: bts_blocks,
      text: "New support question from #{display_name}"
    )

    ticket.update!(bts_message_ts: result["ts"]) if result["ok"]
  rescue StandardError => e
    Rails.logger.error("SupportTicketJob failed: #{e.class}: #{e.message}\n#{e.backtrace&.first(10)&.join("\n")}")
  end

  def self.bts_blocks(ticket)
    status_emoji = case ticket.status
    when "open" then ":large_yellow_circle:"
    when "claimed" then ":large_blue_circle:"
    when "resolved" then ":white_check_mark:"
    end

    status_text = ticket.status.capitalize
    status_text += " by #{ticket.claimed_by_name}" if ticket.claimed? && ticket.claimed_by_name.present?
    status_text += " by #{ticket.resolved_by_name}" if ticket.resolved? && ticket.resolved_by_name.present?

    thread_url = ticket.slack_thread_url

    blocks = [
      {
        type: "context",
        elements: [
          ticket.slack_avatar_url.present? ? { type: "image", image_url: ticket.slack_avatar_url, alt_text: ticket.slack_display_name.to_s } : nil,
          { type: "mrkdwn", text: "*#{ticket.slack_display_name}*" }
        ].compact
      },
      {
        type: "section",
        text: { type: "mrkdwn", text: ticket.original_text.truncate(2900) }
      },
      {
        type: "context",
        elements: [
          { type: "mrkdwn", text: "#{status_emoji} *#{status_text}* | <#{thread_url}|View thread>" }
        ]
      }
    ]

    unless ticket.resolved?
      blocks << {
        type: "actions",
        elements: [
          {
            type: "button",
            text: { type: "plain_text", text: "Claim", emoji: true },
            action_id: "support_claim",
            value: ticket.id.to_s
          },
          {
            type: "button",
            text: { type: "plain_text", text: "Mark Resolved", emoji: true },
            style: "primary",
            action_id: "support_resolve",
            value: ticket.id.to_s
          }
        ]
      }
    end

    blocks
  end

  private

  def slack_client
    @slack_client ||= Slack::Web::Client.new(token: ENV.fetch("SLACK_BOT_TOKEN", nil))
  end
end
