class Admin::GrantMergesController < Admin::ApplicationController
  before_action :require_orders_permission!

  MERGED_PURPOSE = "Merged Forge grant".freeze

  def index
    query = params[:query].to_s.strip
    user = find_user(query) if query.present?

    render inertia: "Admin/GrantMerges/Index", props: {
      query: query,
      user: user && serialize_user(user),
      grants: user ? grants_for(user) : [],
      not_found: query.present? && user.nil?,
      hcb_connected: HcbService.connected?
    }
  end

  def create
    user = User.kept.find(params[:user_id])
    grant_ids = Array(params[:grant_ids]).map(&:to_s).uniq
    return_path = admin_grant_merges_path(query: params[:query].to_s)

    if grant_ids.size != 2
      redirect_to return_path, alert: "Select exactly two different grants to merge."
      return
    end

    groups = grouped_orders(user).slice(*grant_ids)
    if groups.size != 2
      redirect_to return_path, alert: "Those grants don't belong to #{user.display_name}."
      return
    end

    grants = grant_ids.map { |id| HcbService.fetch_card_grant(id) }
    inactive = grants.reject { |g| g[:status] == "active" }
    if inactive.any?
      redirect_to return_path, alert: "Only active grants can be merged (#{inactive.map { |g| "#{g[:id]} is #{g[:status]}" }.join(', ')})."
      return
    end

    amount_cents = grants.sum { |g| g[:balance_cents].to_i }
    unless amount_cents.positive?
      redirect_to return_path, alert: "Both grants have a zero balance, so there's nothing to merge."
      return
    end

    orders = groups.values.flatten
    canceled = []
    merged = nil
    begin
      grants.each do |grant|
        HcbService.cancel_card_grant!(grant[:id])
        canceled << grant[:id]
      end
      merged = HcbService.issue_card_grant!(
        amount_cents: amount_cents,
        email: user.email,
        purpose: merged_purpose(orders),
        instructions: merged_instructions(orders)
      )
    rescue HcbService::Error => e
      audit!("grant_merge.failed", target: user, metadata: {
        grant_ids: grant_ids, canceled_grant_ids: canceled, amount_cents: amount_cents, error: e.message
      })
      redirect_to return_path, alert: failure_message(e, canceled)
      return
    end

    Order.transaction do
      orders.each { |order| order.update!(hcb_grant_link: merged[:link]) }
    end

    audit!("grant_merge.completed", target: user, metadata: {
      order_ids: orders.map(&:id),
      canceled_grant_ids: canceled,
      hcb_card_grant_id: merged[:id],
      hcb_grant_link: merged[:link],
      amount_cents: amount_cents
    })
    redirect_to return_path, notice: "Merged into a new $#{format('%.2f', amount_cents / 100.0)} grant: #{merged[:link]}"
  rescue HcbService::Error => e
    redirect_to return_path, alert: e.message
  end

  private

  def require_orders_permission!
    require_permission!("orders")
  end

  def find_user(query)
    scope = User.kept
    query.include?("@") ? scope.find_by("LOWER(email) = ?", query.downcase) : scope.find_by(slack_id: query)
  end

  def serialize_user(user)
    {
      id: user.id,
      display_name: user.display_name,
      avatar: user.avatar,
      email: user.email,
      slack_id: user.slack_id
    }
  end

  def grouped_orders(user)
    Order.fulfilled
      .where(user_id: user.id)
      .where.not(hcb_grant_link: [ nil, "" ])
      .includes(:project, :shop_item)
      .order(fulfilled_at: :desc)
      .group_by { |order| HcbService.grant_public_id(order.hcb_grant_link) }
  end

  def grants_for(user)
    connected = HcbService.connected?

    grouped_orders(user).map { |hcb_id, orders|
      live = hcb_id && connected ? live_grant(hcb_id) : nil
      {
        hcb_id: hcb_id,
        hcb_grant_link: orders.first.hcb_grant_link,
        status: live&.dig(:status),
        amount_usd: live && live[:amount_cents] && HcbService.cents_to_usd(live[:amount_cents]),
        balance_usd: live && live[:balance_cents] && HcbService.cents_to_usd(live[:balance_cents]),
        hcb_error: live&.dig(:error),
        orders: orders.map { |o|
          {
            id: o.id,
            kind_label: o.kind_label,
            project_name: o.project&.name,
            amount_usd: o.amount_usd&.to_f,
            fulfilled_at: o.fulfilled_at&.strftime("%b %d, %Y")
          }
        }
      }
    }
  end

  def live_grant(hcb_id)
    HcbService.fetch_card_grant(hcb_id)
  rescue HcbService::Error => e
    { error: e.message }
  end

  def merged_purpose(orders)
    purposes = orders.map(&:grant_purpose).compact_blank.uniq
    purposes.one? ? purposes.first : MERGED_PURPOSE
  end

  def merged_instructions(orders)
    orders.map(&:grant_description).compact_blank.uniq.join("\n\n")
  end

  def failure_message(error, canceled)
    return error.message if canceled.empty?

    "#{error.message} Grants #{canceled.join(' and ')} were already cancelled on HCB and no merged grant was issued, so issue it by hand."
  end
end
