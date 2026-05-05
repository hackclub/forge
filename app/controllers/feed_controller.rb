class FeedController < ApplicationController
  AD_INTERVAL_MIN = 3
  AD_INTERVAL_MAX = 6

  before_action :require_reels_enabled!

  def index
    scope = Reel.recent.includes(:user, :project, :reel_images)
    @pagy, @reels = pagy(scope, items: 10)

    items = @reels.map { |reel| serialize_reel(reel) }
    items = inject_ads(items)

    render inertia: "Feed/Index", props: {
      reels: items,
      pagy: pagy_props(@pagy)
    }
  end

  private

  def inject_ads(items)
    ads = ReelAd.enabled.to_a
    return items if ads.empty? || items.empty?

    out = []
    next_ad_at = rand(AD_INTERVAL_MIN..AD_INTERVAL_MAX)
    items.each_with_index do |item, i|
      out << item
      if (i + 1) == next_ad_at
        out << serialize_ad(ads.sample)
        next_ad_at = (i + 1) + rand(AD_INTERVAL_MIN..AD_INTERVAL_MAX)
      end
    end
    out
  end

  def serialize_ad(ad)
    {
      is_ad: true,
      id: ad.id,
      title: ad.title,
      video_url: ad.video_url,
      click_url: ad.click_url,
      duration_seconds: ad.duration_seconds
    }
  end

  def serialize_reel(reel)
    {
      id: reel.id,
      title: reel.title,
      kind: reel.kind,
      video_url: reel.video_url,
      audio_url: reel.audio_url,
      duration_seconds: reel.duration_seconds,
      kudos_count: reel.kudos_count,
      comments_count: reel.comments_count,
      views_count: reel.views_count,
      kudoed: reel.kudoed_by?(current_user),
      created_at: reel.created_at.iso8601,
      images: reel.reel_images.map { |img| { id: img.id, url: img.image_url, position: img.position } },
      project: {
        id: reel.project_id,
        name: reel.project.name
      },
      user: {
        id: reel.user_id,
        display_name: reel.user.display_name,
        avatar: reel.user.avatar
      }
    }
  end
end
