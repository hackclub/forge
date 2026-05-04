class Reels::ViewsController < ApplicationController
  before_action :require_reels_enabled!

  def create
    reel = Reel.find(params[:reel_id])
    return head :no_content if reel.user_id == current_user.id

    ReelView.find_or_create_by(reel: reel, user: current_user)
    head :no_content
  rescue ActiveRecord::RecordNotUnique
    head :no_content
  end
end
