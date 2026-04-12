class Admin::OrdersController < Admin::ApplicationController
  before_action :require_orders_permission!
  before_action :set_order, only: [ :show, :approve, :reject, :fulfill, :reassign ]

  def index
    scope = Order.includes(:user, :project, :shop_item, :reviewer, :assigned_to).order(created_at: :desc)
    scope = scope.where(status: params[:status]) if params[:status].present?
    scope = scope.where(kind: params[:kind]) if params[:kind].present?
    scope = scope.where(region: params[:region]) if params[:region].present?
    if current_user.fulfillment? && !params.key?(:assigned_to)
      scope = scope.where(assigned_to_id: current_user.id)
    elsif params[:assigned_to] == "me"
      scope = scope.where(assigned_to_id: current_user.id)
    end
    @pagy, @orders = pagy(scope, limit: 50)

    render inertia: "Admin/Orders/Index", props: {
      orders: @orders.map { |o| serialize_row(o) },
      pagy: pagy_props(@pagy),
      filters: {
        status: params[:status].to_s,
        kind: params[:kind].to_s,
        region: params[:region].to_s,
        assigned_to: (current_user.fulfillment? && !params.key?(:assigned_to)) ? "me" : params[:assigned_to].to_s
      },
      counts: {
        all: Order.count,
        pending: Order.pending.count,
        approved: Order.approved.count,
        fulfilled: Order.fulfilled.count,
        rejected: Order.rejected.count
      },
      regions: HasRegion::REGIONS,
      fulfillment_users: fulfillment_users_list
    }
  end

  def show
    render inertia: "Admin/Orders/Show", props: {
      order: serialize_detail(@order),
      warnings: build_warnings(@order),
      regions: HasRegion::REGIONS,
      fulfillment_users: fulfillment_users_list
    }
  end

  def approve
    if @order.pending?
      @order.update!(status: :approved, reviewer: current_user, reviewed_at: Time.current, review_notes: params[:review_notes].to_s.strip.presence)
      audit!("order.approved", target: @order, label: @order.kind_label, metadata: { amount_usd: @order.amount_usd.to_f, coin_cost: @order.coin_cost.to_f })
    end
    redirect_to admin_order_path(@order), notice: "Order approved."
  end

  def reject
    notes = params[:review_notes].to_s.strip
    if notes.blank?
      redirect_to admin_order_path(@order), alert: "Provide a reason when rejecting."
      return
    end

    @order.update!(status: :rejected, reviewer: current_user, reviewed_at: Time.current, review_notes: notes)
    audit!("order.rejected", target: @order, label: @order.kind_label, metadata: { reason: notes, coin_cost: @order.coin_cost.to_f })
    redirect_to admin_order_path(@order), notice: "Order rejected. Coins refunded to user."
  end

  def fulfill
    grant_link = params[:hcb_grant_link].to_s.strip
    if grant_link.blank?
      redirect_to admin_order_path(@order), alert: "Paste the HCB grant link before marking fulfilled."
      return
    end

    @order.update!(
      status: :fulfilled,
      hcb_grant_link: grant_link,
      fulfilled_at: Time.current,
      reviewer: @order.reviewer || current_user
    )
    audit!("order.fulfilled", target: @order, label: @order.kind_label, metadata: { hcb_grant_link: grant_link })
    redirect_to admin_order_path(@order), notice: "Order marked fulfilled."
  end

  def reassign
    assignee_id = params[:assigned_to_id].presence
    if assignee_id
      assignee = User.find(assignee_id)
      @order.update!(assigned_to: assignee)
      audit!("order.reassigned", target: @order, metadata: { assigned_to_id: assignee.id, assigned_to_name: assignee.display_name })
      redirect_to admin_order_path(@order), notice: "Order reassigned to #{assignee.display_name}."
    else
      @order.update!(assigned_to: nil)
      audit!("order.unassigned", target: @order)
      redirect_to admin_order_path(@order), notice: "Order unassigned."
    end
  end

  private

  def set_order
    @order = Order.find(params[:id])
  end

  def require_orders_permission!
    require_permission!("orders")
  end

  def serialize_row(order)
    {
      id: order.id,
      kind: order.kind,
      kind_label: order.kind_label,
      status: order.status,
      quantity: order.quantity,
      amount_usd: order.amount_usd&.to_f,
      coin_cost: order.coin_cost.to_f,
      user_id: order.user_id,
      user_display_name: order.user.display_name,
      project_id: order.project_id,
      project_name: order.project&.name,
      shop_item_image: order.shop_item&.image_url,
      needs_attention: order.shop_item? && (!order.user.can_buy_shop_items? || ungranted_projects(order.user).any?),
      region: order.region,
      assigned_to_id: order.assigned_to_id,
      assigned_to_name: order.assigned_to&.display_name,
      created_at: order.created_at.strftime("%b %d, %Y %H:%M")
    }
  end

  def serialize_detail(order)
    {
      id: order.id,
      kind: order.kind,
      kind_label: order.kind_label,
      status: order.status,
      quantity: order.quantity,
      amount_usd: order.amount_usd&.to_f,
      coin_cost: order.coin_cost.to_f,
      description: order.description,
      review_notes: order.review_notes,
      hcb_grant_link: order.hcb_grant_link,
      internal_order_link: order.shop_item&.internal_order_link,
      internal_price_usd: order.shop_item&.internal_price_usd&.to_f,
      user_id: order.user_id,
      user_display_name: order.user.display_name,
      user_avatar: order.user.avatar,
      user_balance: order.user.coin_balance,
      project_id: order.project_id,
      project_name: order.project&.name,
      shop_item_id: order.shop_item_id,
      shop_item_name: order.shop_item&.name,
      shop_item_image: order.shop_item&.image_url,
      region: order.region,
      assigned_to_id: order.assigned_to_id,
      assigned_to_name: order.assigned_to&.display_name,
      reviewer_name: order.reviewer&.display_name,
      reviewed_at: order.reviewed_at&.strftime("%b %d, %Y %H:%M"),
      fulfilled_at: order.fulfilled_at&.strftime("%b %d, %Y %H:%M"),
      created_at: order.created_at.strftime("%b %d, %Y %H:%M")
    }
  end

  def build_warnings(order)
    warnings = []

    if order.shop_item?
      unless order.user.can_buy_shop_items?
        warnings << {
          severity: "warning",
          message: "#{order.user.display_name} hasn't marked any project as built yet. They should redeem a direct grant and build it before spending coins on shop items."
        }
      end

      ungranted = ungranted_projects(order.user)
      ungranted.each do |project|
        warnings << {
          severity: "warning",
          message: "Project '#{project.name}' has no direct hardware grant yet. Make sure they're not buying fun stuff before funding their project."
        }
      end
    end

    warnings
  end

  def ungranted_projects(user)
    user.projects.kept.where(status: %i[approved build_pending build_approved]).reject(&:has_fulfilled_direct_grant?)
  end

  def fulfillment_users_list
    User.where("'fulfillment' = ANY(roles)").order(:display_name).map { |u|
      { id: u.id, display_name: u.display_name }
    }
  end
end
