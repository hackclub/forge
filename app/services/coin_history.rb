class CoinHistory
  Entry = Struct.new(:at, :type, :amount, :label, :details, keyword_init: true)

  def initialize(user)
    @user = user
  end

  def entries
    items = []

    @user.coin_adjustments.includes(:actor).each do |adj|
      items << Entry.new(
        at: adj.created_at,
        type: "adjustment",
        amount: adj.amount.to_f,
        label: adj.reason,
        details: {
          actor_id: adj.actor_id,
          actor_name: adj.actor&.display_name || "System"
        }
      )
    end

    @user.orders.includes(:project, :shop_item, :reviewer).each do |order|
      items << Entry.new(
        at: order.created_at,
        type: "order_placed",
        amount: -order.coin_cost.to_f,
        label: "Placed order - #{order.kind_label}",
        details: {
          order_id: order.id,
          kind: order.kind,
          status: order.status,
          amount_usd: order.amount_usd&.to_f,
          project_id: order.project_id,
          project_name: order.project&.name,
          shop_item_id: order.shop_item_id,
          shop_item_name: order.shop_item&.name,
          reviewer_id: order.reviewer_id,
          reviewer_name: order.reviewer&.display_name,
          description: order.description
        }
      )

      if order.rejected? && order.reviewed_at
        items << Entry.new(
          at: order.reviewed_at,
          type: "order_refunded",
          amount: order.coin_cost.to_f,
          label: "Refund - #{order.kind_label} rejected",
          details: {
            order_id: order.id,
            reviewer_id: order.reviewer_id,
            reviewer_name: order.reviewer&.display_name,
            review_notes: order.review_notes
          }
        )
      end

      if order.fulfilled? && order.fulfilled_at
        items << Entry.new(
          at: order.fulfilled_at,
          type: "order_fulfilled",
          amount: 0,
          label: "Order fulfilled - #{order.kind_label}",
          details: {
            order_id: order.id,
            reviewer_id: order.reviewer_id,
            reviewer_name: order.reviewer&.display_name,
            hcb_grant_link: order.hcb_grant_link
          }
        )
      end
    end

    # Solo projects pay the owner in full; group projects pay each member
    # their snapshotted ProjectPayout share (mirrors User#coins_earned).
    @user.projects.kept.approved.where.not(id: ProjectPayout.select(:project_id)).each do |project|
      coins = project.coins_earned
      next if coins.zero?

      items << Entry.new(
        at: project.reviewed_at || project.updated_at,
        type: "earned",
        amount: coins,
        label: "Earned from #{project.name}",
        details: {
          project_id: project.id,
          project_name: project.name,
          tier: project.tier,
          rate: project.coin_rate,
          hours: project.total_hours.round(2)
        }
      )
    end

    @user.project_payouts.joins(:project).merge(Project.kept.approved).includes(:project).each do |payout|
      next if payout.coins.to_f.zero?

      project = payout.project
      items << Entry.new(
        at: project.reviewed_at || payout.created_at,
        type: "earned",
        amount: payout.coins.to_f,
        label: "Earned from #{project.name} (your share)",
        details: {
          project_id: project.id,
          project_name: project.name,
          tier: project.tier,
          rate: project.coin_rate,
          hours: payout.hours.to_f
        }
      )
    end

    items.sort_by { |i| -i.at.to_i }
  end

  def serialize
    entries.map do |e|
      {
        at: e.at.iso8601,
        date: e.at.strftime("%b %d, %Y %H:%M"),
        type: e.type,
        amount: e.amount.round(2),
        label: e.label,
        details: e.details
      }
    end
  end
end
