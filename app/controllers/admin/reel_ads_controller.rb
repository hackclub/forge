class Admin::ReelAdsController < Admin::ApplicationController
  MAX_VIDEO_BYTES = 50.megabytes

  before_action :require_reel_ads_permission!

  def index
    ads = ReelAd.recent
    render inertia: "Admin/ReelAds/Index", props: {
      ads: ads.map { |ad| serialize_ad(ad) },
      max_video_mb: MAX_VIDEO_BYTES / 1.megabyte
    }
  end

  def create
    file = params[:video]
    if !file.respond_to?(:read) || !file.content_type.to_s.start_with?("video/")
      return redirect_to admin_reel_ads_path, alert: "Please choose a video file."
    end
    if file.size > MAX_VIDEO_BYTES
      return redirect_to admin_reel_ads_path, alert: "Video must be #{MAX_VIDEO_BYTES / 1.megabyte} MB or smaller."
    end

    cdn_url = HcCdnService.upload(io: file.tempfile, filename: file.original_filename, content_type: file.content_type)
    return redirect_to admin_reel_ads_path, alert: "Upload failed. Try again." if cdn_url.blank?

    ad = ReelAd.new(
      title: params[:title],
      click_url: params[:click_url].presence,
      duration_seconds: params[:duration_seconds].presence,
      video_url: cdn_url,
      enabled: ActiveModel::Type::Boolean.new.cast(params[:enabled].nil? ? true : params[:enabled])
    )

    if ad.save
      audit!("reel_ad.created", target: ad, label: ad.title, metadata: { ad_id: ad.id })
      redirect_to admin_reel_ads_path, notice: "Ad created."
    else
      redirect_to admin_reel_ads_path, alert: ad.errors.full_messages.to_sentence
    end
  end

  def update
    ad = ReelAd.find(params[:id])
    attrs = {
      title: params[:title],
      click_url: params[:click_url].presence
    }
    attrs[:enabled] = ActiveModel::Type::Boolean.new.cast(params[:enabled]) unless params[:enabled].nil?

    if ad.update(attrs)
      audit!("reel_ad.updated", target: ad, label: ad.title, metadata: { ad_id: ad.id, changes: audit_changes_for(ad) })
      redirect_to admin_reel_ads_path, notice: "Ad updated."
    else
      redirect_to admin_reel_ads_path, alert: ad.errors.full_messages.to_sentence
    end
  end

  def toggle
    ad = ReelAd.find(params[:id])
    ad.update!(enabled: !ad.enabled)
    audit!("reel_ad.toggled", target: ad, label: ad.title, metadata: { ad_id: ad.id, enabled: ad.enabled })
    redirect_to admin_reel_ads_path, notice: "Ad #{ad.enabled? ? 'enabled' : 'disabled'}."
  end

  def destroy
    ad = ReelAd.find(params[:id])
    audit!("reel_ad.destroyed", target: nil, label: ad.title, metadata: { ad_id: ad.id, title: ad.title })
    ad.destroy
    redirect_to admin_reel_ads_path, notice: "Ad deleted."
  end

  private

  def require_reel_ads_permission!
    require_permission!("reel_ads")
  end

  def serialize_ad(ad)
    ctr = ad.impressions_count.positive? ? (ad.clicks_count.to_f / ad.impressions_count * 100).round(1) : 0.0
    {
      id: ad.id,
      title: ad.title,
      video_url: ad.video_url,
      click_url: ad.click_url,
      duration_seconds: ad.duration_seconds,
      enabled: ad.enabled,
      impressions_count: ad.impressions_count,
      clicks_count: ad.clicks_count,
      ctr: ctr,
      created_at: ad.created_at.strftime("%b %d, %Y")
    }
  end
end
