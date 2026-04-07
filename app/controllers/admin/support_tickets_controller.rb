class Admin::SupportTicketsController < Admin::ApplicationController
  before_action :require_support_permission!

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

  private

  def require_support_permission!
    require_permission!("support")
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
