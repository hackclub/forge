class Reels::KudosController < ApplicationController
  before_action :require_reels_enabled!
  before_action :set_reel

  def create
    kudo = @reel.reel_kudos.find_or_initialize_by(user: current_user)
    authorize kudo, :create?
    kudo.save unless kudo.persisted?

    redirect_back(fallback_location: reels_feed_path)
  end

  def destroy
    kudo = @reel.reel_kudos.find_by(user: current_user)
    if kudo
      authorize kudo
      kudo.destroy
    end

    redirect_back(fallback_location: reels_feed_path)
  end

  private

  def set_reel
    @reel = Reel.find(params[:reel_id])
  end
end
