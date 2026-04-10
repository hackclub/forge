class Admin::SupportTicketsController < Admin::ApplicationController
  before_action :require_support_permission!
  before_action :set_ticket, only: [ :show, :reply, :claim, :resolve, :destroy ]

  def index
    scope = policy_scope(SupportTicket)
    scope = scope.where(status: params[:status]) if params[:status].present?
    @pagy, @tickets = pagy(scope.order(created_at: :desc))

    render inertia: "Admin/SupportTickets/Index", props: {
      tickets: @tickets.map { |t| serialize_ticket(t) },
      pagy: pagy_props(@pagy),
      status_filter: params[:status].to_s,
      counts: {
        all: SupportTicket.count,
        open: SupportTicket.open.count,
        claimed: SupportTicket.claimed.count,
        resolved: SupportTicket.resolved.count
      },
      leaderboard: build_leaderboard
    }
  end

  def show
    authorize @ticket

    render inertia: "Admin/SupportTickets/Show", props: {
      ticket: serialize_ticket_detail(@ticket),
      messages: fetch_thread_messages(@ticket),
      can: {
        reply: policy(@ticket).reply?,
        claim: policy(@ticket).claim?,
        resolve: policy(@ticket).resolve?,
        destroy: policy(@ticket).destroy?
      }
    }
  end

  def reply
    authorize @ticket
    text = params[:message].to_s.strip
    return redirect_to admin_support_ticket_path(@ticket), alert: "Message cannot be blank." if text.blank?

    slack_client.chat_postMessage(
      channel: @ticket.channel_id,
      thread_ts: @ticket.thread_ts,
      text: text,
      username: current_user.display_name,
      icon_url: current_user.avatar
    )

    if @ticket.bts_message_ts.present?
      slack_client.chat_postMessage(
        channel: @ticket.bts_channel_id,
        thread_ts: @ticket.bts_message_ts,
        text: text,
        username: current_user.display_name,
        icon_url: current_user.avatar
      )
    end

    audit!("support_ticket.replied", target: @ticket, label: @ticket.slack_display_name, metadata: { message: text })
    redirect_to admin_support_ticket_path(@ticket), notice: "Reply sent."
  rescue StandardError => e
    Rails.logger.error("Support reply failed: #{e.message}")
    redirect_to admin_support_ticket_path(@ticket), alert: "Failed to send reply."
  end

  def claim
    authorize @ticket
    return redirect_to admin_support_ticket_path(@ticket) if @ticket.resolved?

    @ticket.update!(
      status: :claimed,
      claimed_by_slack_id: current_user.slack_id,
      claimed_by_name: current_user.display_name,
      claimed_at: Time.current
    )

    update_bts_message(@ticket)
    audit!("support_ticket.claimed", target: @ticket, label: @ticket.slack_display_name)
    redirect_to admin_support_ticket_path(@ticket), notice: "Ticket claimed."
  end

  def resolve
    authorize @ticket
    return redirect_to admin_support_ticket_path(@ticket), notice: "Already resolved." if @ticket.resolved?

    @ticket.update!(
      status: :resolved,
      resolved_by_slack_id: current_user.slack_id,
      resolved_by_name: current_user.display_name,
      resolved_at: Time.current
    )

    slack_client.chat_postMessage(
      channel: @ticket.channel_id,
      thread_ts: @ticket.thread_ts,
      text: ":white_check_mark: <@#{@ticket.slack_user_id}> This question has been marked as resolved by <@#{current_user.slack_id}>!"
    )
    slack_client.reactions_add(
      channel: @ticket.channel_id,
      timestamp: @ticket.thread_ts,
      name: "white_check_mark"
    )
    update_bts_message(@ticket)
    audit!("support_ticket.resolved", target: @ticket, label: @ticket.slack_display_name)
    redirect_to admin_support_ticket_path(@ticket), notice: "Ticket resolved."
  rescue StandardError => e
    Rails.logger.error("Support resolve failed: #{e.message}")
    redirect_to admin_support_ticket_path(@ticket), alert: "Failed to resolve ticket."
  end

  def destroy
    authorize @ticket
    audit!("support_ticket.destroyed", target: @ticket, label: @ticket.slack_display_name, metadata: { ticket_id: @ticket.id })
    @ticket.destroy
    redirect_to admin_support_tickets_path, notice: "Ticket permanently deleted."
  end

  private

  def set_ticket
    @ticket = SupportTicket.find(params[:id])
  end

  def require_support_permission!
    require_permission!("support")
  end

  def fetch_thread_messages(ticket)
    result = slack_client.conversations_replies(
      channel: ticket.channel_id,
      ts: ticket.thread_ts,
      limit: 100
    )

    return [] unless result["ok"]

    result["messages"].map do |msg|
      user_info = fetch_slack_profile(msg["user"])
      {
        text: msg["text"],
        user: msg["user"],
        display_name: user_info[:display_name],
        avatar_url: user_info[:avatar_url],
        ts: msg["ts"],
        is_bot: msg["bot_id"].present?,
        created_at: Time.at(msg["ts"].to_f).strftime("%b %d, %Y %H:%M")
      }
    end
  rescue StandardError => e
    Rails.logger.error("Failed to fetch thread messages: #{e.message}")
    []
  end

  def fetch_slack_profile(slack_user_id)
    return { display_name: "Bot", avatar_url: nil } if slack_user_id.blank?

    result = slack_client.users_info(user: slack_user_id)
    profile = result&.user&.profile
    {
      display_name: profile&.display_name.presence || profile&.real_name.presence || "Unknown",
      avatar_url: profile&.image_72.presence
    }
  rescue StandardError
    { display_name: "Unknown", avatar_url: nil }
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

  def slack_client
    @slack_client ||= Slack::Web::Client.new(token: ENV.fetch("SLACK_BOT_TOKEN", nil))
  end

  def serialize_ticket(ticket)
    {
      id: ticket.id,
      slack_display_name: ticket.slack_display_name,
      slack_avatar_url: ticket.slack_avatar_url,
      original_text: ticket.original_text.truncate(200),
      status: ticket.status,
      claimed_by_name: ticket.claimed_by_name,
      resolved_by_name: ticket.resolved_by_name,
      slack_thread_url: ticket.slack_thread_url,
      bts_thread_url: ticket.bts_thread_url,
      created_at: ticket.created_at.strftime("%b %d, %Y %H:%M"),
      resolved_at: ticket.resolved_at&.strftime("%b %d, %Y %H:%M")
    }
  end

  def serialize_ticket_detail(ticket)
    {
      id: ticket.id,
      slack_display_name: ticket.slack_display_name,
      slack_avatar_url: ticket.slack_avatar_url,
      original_text: ticket.original_text,
      status: ticket.status,
      claimed_by_name: ticket.claimed_by_name,
      resolved_by_name: ticket.resolved_by_name,
      slack_thread_url: ticket.slack_thread_url,
      bts_thread_url: ticket.bts_thread_url,
      created_at: ticket.created_at.strftime("%b %d, %Y %H:%M"),
      resolved_at: ticket.resolved_at&.strftime("%b %d, %Y %H:%M")
    }
  end

  def build_leaderboard
    SupportTicket.resolved
      .where.not(resolved_by_name: nil)
      .group(:resolved_by_name)
      .order(Arel.sql("count(*) DESC"))
      .limit(10)
      .count
      .map { |name, count| { name: name, count: count } }
  end
end
