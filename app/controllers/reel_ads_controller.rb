class ReelAdsController < ApplicationController
  before_action :require_reels_enabled!

  def impression
    ReelAd.find(params[:id]).record_impression!
    head :no_content
  end

  def click
    ReelAd.find(params[:id]).record_click!
    head :no_content
  end
end
