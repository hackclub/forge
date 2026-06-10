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
    response_url = payload["response_url"]

    case action["action_id"]
    when "support_claim"
      handle_claim(action["value"], slack_user_id, display_name)
    when "support_resolve"
      handle_resolve(action["value"], slack_user_id, display_name)
    when "support_public_resolve"
      handle_public_resolve(action["value"], slack_user_id, display_name, response_url)
    when "support_public_reopen"
      handle_public_reopen(action["value"], slack_user_id, response_url)
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
    SupportTicketJob.delete_bts_message(ticket)
    SupportTicketJob.update_public_response(ticket)
  end

  def handle_public_resolve(ticket_id, slack_user_id, display_name, response_url)
    ticket = SupportTicket.find_by(id: ticket_id)
    return unless ticket
    unless can_act_on_ticket?(ticket, slack_user_id)
      ephemeral_nudge(response_url, "only the asker or support staff can mark this resolved")
      return
    end

    handle_resolve(ticket_id, slack_user_id, display_name)
  end

  def handle_public_reopen(ticket_id, slack_user_id, response_url)
    ticket = SupportTicket.find_by(id: ticket_id)
    return unless ticket
    unless can_act_on_ticket?(ticket, slack_user_id)
      ephemeral_nudge(response_url, "only the asker or support staff can reopen this")
      return
    end
    return unless ticket.resolved?

    ticket.update!(
      status: :open,
      resolved_by_slack_id: nil,
      resolved_by_name: nil,
      resolved_at: nil
    )

    SupportTicketJob.recreate_bts_message(ticket)
    SupportTicketJob.update_public_response(ticket)

    begin
      slack_client.reactions_remove(
        channel: ticket.channel_id,
        timestamp: ticket.thread_ts,
        name: "white_check_mark"
      )
    rescue Slack::Web::Api::Errors::NoReaction
    end
    begin
      slack_client.reactions_add(
        channel: ticket.channel_id,
        timestamp: ticket.thread_ts,
        name: "thinking_face"
      )
    rescue Slack::Web::Api::Errors::AlreadyReacted
    end

    slack_client.chat_postMessage(
      channel: ticket.channel_id,
      thread_ts: ticket.thread_ts,
      text: ":arrows_counterclockwise: <@#{slack_user_id}> reopened this question."
    )
  rescue StandardError => e
    Rails.logger.error("Failed to reopen ticket: #{e.message}")
  end


  def notify_public_resolved(ticket, resolver_slack_id = nil)
    resolver_id = resolver_slack_id || ticket.resolved_by_slack_id
    resolver_mention = resolver_id ? "<@#{resolver_id}>" : "the team"
    slack_client.chat_postMessage(
      channel: ticket.channel_id,
      thread_ts: ticket.thread_ts,
      text: "Ohohoho looks like this message has been marked resolved by #{resolver_mention}, if you have any more questions feel free to make a new ticket"
    )
    begin
      slack_client.reactions_remove(
        channel: ticket.channel_id,
        timestamp: ticket.thread_ts,
        name: "thinking_face"
      )
    rescue Slack::Web::Api::Errors::NoReaction
    end
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

  def can_act_on_ticket?(ticket, slack_user_id)
    return true if ticket.slack_user_id == slack_user_id

    User.find_by(slack_id: slack_user_id)&.has_permission?("support") || false
  end

  def ephemeral_nudge(response_url, text)
    return if response_url.blank?

    uri = URI.parse(response_url)
    Net::HTTP.start(uri.host, uri.port, use_ssl: uri.scheme == "https") do |http|
      req = Net::HTTP::Post.new(uri.request_uri, "Content-Type" => "application/json")
      req.body = { response_type: "ephemeral", text: text }.to_json
      http.request(req)
    end
  rescue StandardError => e
    Rails.logger.error("Failed to send ephemeral nudge: #{e.message}")
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
