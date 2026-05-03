class FeedController < ApplicationController
  before_action :require_reels_enabled!

  def index
    scope = Reel.recent.includes(:user, :project, :reel_images)
    @pagy, @reels = pagy(scope, items: 10)

    render inertia: "Feed/Index", props: {
      reels: @reels.map { |reel| serialize_reel(reel) },
      pagy: pagy_props(@pagy)
    }
  end

  private

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
