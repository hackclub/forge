class Admin::ReelPayoutsController < Admin::ApplicationController
  before_action :require_superadmin!
  before_action :set_request, only: [ :approve, :reject ]

  def index
    pending = ReelPayoutRequest.pending.recent.includes(reel: [ :user, :project ])
    history = ReelPayoutRequest.where.not(status: "pending").recent.includes(reel: [ :user, :project ], reviewer: []).limit(50)

    render inertia: "Admin/ReelPayouts/Index", props: {
      pending: pending.map { |r| serialize(r) },
      history: history.map { |r| serialize(r) }
    }
  end

  def approve
    if @request.approve!(current_user)
      audit!("reel_payout.approved", target: @request.reel, label: "##{@request.reel_id}", metadata: { amount: @request.amount.to_f, request_id: @request.id })
      redirect_to admin_reel_payouts_path, notice: "Approved #{@request.amount} coins."
    else
      redirect_to admin_reel_payouts_path, alert: "Couldn't approve (already resolved?)."
    end
  end

  def reject
    if @request.reject!(current_user, reason: params[:reason])
      audit!("reel_payout.rejected", target: @request.reel, label: "##{@request.reel_id}", metadata: { amount: @request.amount.to_f, request_id: @request.id, reason: params[:reason] })
      redirect_to admin_reel_payouts_path, notice: "Rejected."
    else
      redirect_to admin_reel_payouts_path, alert: "Couldn't reject (already resolved?)."
    end
  end

  private

  def require_superadmin!
    raise ActionController::RoutingError, "Not Found" unless current_user&.superadmin?
  end

  def set_request
    @request = ReelPayoutRequest.find(params[:id])
  end

  def serialize(req)
    {
      id: req.id,
      amount: req.amount.to_f,
      status: req.status,
      reason: req.reason,
      created_at: req.created_at.strftime("%b %d, %Y %l:%M%P"),
      reviewed_at: req.reviewed_at&.strftime("%b %d, %Y %l:%M%P"),
      reviewer: req.reviewer && { id: req.reviewer_id, display_name: req.reviewer.display_name },
      reel: {
        id: req.reel_id,
        kind: req.reel.kind,
        title: req.reel.title,
        views: req.reel.views_count,
        kudos: req.reel.kudos_count,
        comments: req.reel.comments_count,
        lifetime_paid: req.reel.lifetime_payout_coins.to_f,
        user: { id: req.reel.user_id, display_name: req.reel.user.display_name, avatar: req.reel.user.avatar },
        project: { id: req.reel.project_id, name: req.reel.project.name }
      }
    }
  end
end
