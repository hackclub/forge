class Slack::InteractivityController < ApplicationController
  skip_before_action :verify_authenticity_token
  allow_unauthenticated_access

  before_action :verify_slack_request

  def create
    payload = JSON.parse(params[:payload])

    case payload["type"]
    when "block_actions"
      handle_block_actions(payload)
    end

    head :ok
  end

  private

  def handle_block_actions(payload)
    action = payload.dig("actions", 0)
    return unless action

    slack_user_id = payload.dig("user", "id")
    display_name = resolve_display_name(slack_user_id, payload.dig("user", "username"))

    case action["action_id"]
    when "support_claim"
      handle_claim(action["value"], slack_user_id, display_name)
    when "support_resolve"
      handle_resolve(action["value"], slack_user_id, display_name)
    when "support_mark_answered"
      handle_mark_answered(action["value"], slack_user_id, display_name)
    end
  end

  def handle_claim(ticket_id, slack_user_id, display_name)
    ticket = SupportTicket.find_by(id: ticket_id)
    return unless ticket
    return if ticket.resolved?

    ticket.update!(
      status: :claimed,
      claimed_by_slack_id: slack_user_id,
      claimed_by_name: display_name,
      claimed_at: Time.current
    )

    update_bts_message(ticket)
  end

  def handle_resolve(ticket_id, slack_user_id, display_name)
    ticket = SupportTicket.find_by(id: ticket_id)
    return unless ticket
    return if ticket.resolved?

    ticket.update!(
      status: :resolved,
      resolved_by_slack_id: slack_user_id,
      resolved_by_name: display_name,
      resolved_at: Time.current
    )

    notify_public_resolved(ticket, slack_user_id)
    update_bts_message(ticket)
  end

  def handle_mark_answered(ticket_id, slack_user_id, display_name)
    ticket = SupportTicket.find_by(id: ticket_id)
    return unless ticket
    return if ticket.resolved?

    ticket.update!(
      status: :resolved,
      resolved_by_slack_id: slack_user_id,
      resolved_by_name: display_name,
      resolved_at: Time.current
    )

    notify_public_resolved(ticket, display_name)
    update_bts_message(ticket)
  rescue StandardError => e
    Rails.logger.error("Failed to post answered message: #{e.message}")
  end

  def notify_public_resolved(ticket, resolver_slack_id = nil)
    resolver_id = resolver_slack_id || ticket.resolved_by_slack_id
    resolver_mention = resolver_id ? "<@#{resolver_id}>" : "the team"
    slack_client.chat_postMessage(
      channel: ticket.channel_id,
      thread_ts: ticket.thread_ts,
      text: ":white_check_mark: <@#{ticket.slack_user_id}> This question has been marked as resolved by #{resolver_mention}!"
    )
    slack_client.reactions_add(
      channel: ticket.channel_id,
      timestamp: ticket.thread_ts,
      name: "white_check_mark"
    )
  rescue StandardError => e
    Rails.logger.error("Failed to post resolved message: #{e.message}")
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
  rescue StandardError => e
    Rails.logger.error("Failed to update BTS message: #{e.message}")
  end

  def resolve_display_name(slack_user_id, fallback)
    result = slack_client.users_info(user: slack_user_id)
    profile = result&.user&.profile
    profile&.display_name.presence || profile&.real_name.presence || fallback
  rescue StandardError
    fallback
  end

  def slack_client
    @slack_client ||= Slack::Web::Client.new(token: ENV.fetch("SLACK_BOT_TOKEN", nil))
  end

  def verify_slack_request
    signing_secret = ENV.fetch("SLACK_SIGNING_SECRET", "")
    return head(:unauthorized) if signing_secret.blank?

    timestamp = request.headers["X-Slack-Request-Timestamp"]
    return head(:unauthorized) if timestamp.blank?
    return head(:unauthorized) if (Time.now.to_i - timestamp.to_i).abs > 300

    request.body.rewind
    body = request.body.read
    request.body.rewind

    sig_basestring = "v0:#{timestamp}:#{body}"
    my_signature = "v0=#{OpenSSL::HMAC.hexdigest("SHA256", signing_secret, sig_basestring)}"
    slack_signature = request.headers["X-Slack-Signature"]

    head(:unauthorized) unless ActiveSupport::SecurityUtils.secure_compare(my_signature, slack_signature.to_s)
  end
end
