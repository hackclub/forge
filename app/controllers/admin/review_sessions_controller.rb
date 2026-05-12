class Admin::ReviewSessionsController < Admin::ApplicationController
  before_action :require_pending_reviews_permission!
  before_action :set_session

  def heartbeat
    return head :forbidden unless @session.reviewer_id == current_user.id

    seconds = params[:seconds].to_i
    @session.heartbeat!(seconds: seconds)
    render json: { active_seconds: @session.active_seconds }
  end

  private

  def require_pending_reviews_permission!
    require_permission!("pending_reviews")
  end

  def set_session
    @session = ReviewSession.find(params[:id])
  end
end
