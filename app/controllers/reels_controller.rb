class ReelsController < ApplicationController
  MAX_VIDEO_BYTES = 50.megabytes
  MAX_IMAGE_BYTES = 10.megabytes
  MAX_AUDIO_BYTES = 25.megabytes
  AD_INTERVAL_MIN = 3
  AD_INTERVAL_MAX = 6

  before_action :require_reels_enabled!
  before_action :set_project, only: [ :manage, :new, :create ]
  before_action :set_reel,    only: [ :show, :edit, :update, :destroy ]

  def index
    reels = Reel.includes(:user, :project, :reel_images).fair_feed.first(50)

    items = reels.map { |reel| serialize_reel(reel) }
    items = inject_ads(items)

    render inertia: "Reels/Feed", props: {
      reels: items
    }
  end

  def show
    other_reels = Reel.where.not(id: @reel.id).includes(:user, :project, :reel_images).fair_feed.first(49)
    reels = [ @reel ] + other_reels

    items = reels.map { |reel| serialize_reel(reel) }
    items = inject_ads(items)

    render inertia: "Reels/Feed", props: {
      reels: items
    }
  end

  def manage
    authorize @project, :update?

    reels = @project.reels.order(created_at: :desc).includes(:reel_images)

    render inertia: "Reels/Index", props: {
      project: { id: @project.id, name: @project.name },
      reels: reels.map { |r| serialize_for_manage(r) }
    }
  end

  def new
    authorize Reel.new(project: @project, user: current_user), :create?

    render inertia: "Reels/New", props: {
      project: { id: @project.id, name: @project.name },
      max_duration_seconds: Reel::MAX_DURATION_SECONDS,
      max_video_mb: MAX_VIDEO_BYTES / 1.megabyte,
      max_image_mb: MAX_IMAGE_BYTES / 1.megabyte,
      max_audio_mb: MAX_AUDIO_BYTES / 1.megabyte,
      max_images: Reel::MAX_IMAGES
    }
  end

  def create
    kind = params[:kind].to_s
    kind = "video" unless Reel::KINDS.include?(kind)

    reel = Reel.new(project: @project, user: current_user, kind: kind, title: params[:title])
    authorize reel, :create?

    case kind
    when "video"          then create_video(reel)
    when "image_carousel" then create_carousel(reel)
    when "slideshow"      then create_slideshow(reel)
    end
  end

  def edit
    authorize @reel, :update?

    render inertia: "Reels/Edit", props: {
      project: { id: @reel.project_id, name: @reel.project.name },
      reel: { id: @reel.id, title: @reel.title.to_s, kind: @reel.kind }
    }
  end

  def update
    authorize @reel, :update?

    if @reel.update(title: params[:title])
      redirect_to project_reels_path(@reel.project_id), notice: "Reel updated."
    else
      redirect_to edit_reel_path(@reel), alert: @reel.errors.full_messages.to_sentence
    end
  end

  def destroy
    authorize @reel
    project_id = @reel.project_id
    reel_id = @reel.id
    refunded = 0.0

    Reel.transaction do
      paid = @reel.lifetime_payout_coins.to_f
      if paid.positive?
        refunded = paid
        @reel.user.coin_adjustments.create!(
          actor: current_user,
          amount: -paid,
          reason: "Reel ##{reel_id} deleted, payout reversed"
        )
      end
      @reel.destroy!
    end

    audit!("reel.destroyed", target: nil, label: nil, metadata: { project_id: project_id, reel_id: reel_id, refunded_coins: refunded })
    notice = refunded.positive? ? "Reel removed and #{refunded.round(2)}c clawed back from the user." : "Reel removed."
    redirect_to project_reels_path(project_id), notice: notice
  end

  private

  def set_project
    @project = Project.find(params[:project_id])
  end

  def set_reel
    @reel = Reel.find(params[:id])
  end

  def serialize_for_manage(reel)
    pending = reel.reel_payout_requests.pending.sum(:amount).to_f
    {
      id: reel.id,
      title: reel.title,
      kind: reel.kind,
      video_url: reel.video_url,
      first_image_url: reel.reel_images.first&.image_url,
      created_at: reel.created_at.strftime("%b %d, %Y"),
      stats: {
        views: reel.views_count,
        kudos: reel.kudos_count,
        comments: reel.comments_count
      },
      payout: {
        lifetime: reel.lifetime_payout_coins.to_f,
        pending: pending,
        target: reel.payout_target.to_f
      }
    }
  end

  def create_video(reel)
    file = params[:video]
    return fail_back("Please choose a video file.") unless file.respond_to?(:read) && file.content_type.to_s.start_with?("video/")
    return fail_back("Video must be #{MAX_VIDEO_BYTES / 1.megabyte} MB or smaller.") if file.size > MAX_VIDEO_BYTES

    cdn_url = upload_to_cdn(file)
    return fail_back("Upload failed. Try again.") if cdn_url.blank?

    reel.video_url = cdn_url
    reel.duration_seconds = params[:duration_seconds] if params[:duration_seconds].present?

    save_and_redirect(reel)
  end

  def create_carousel(reel)
    images = Array(params[:images]).reject(&:blank?)
    return fail_back("Pick at least one image.") if images.empty?
    return fail_back("Up to #{Reel::MAX_IMAGES} images.") if images.size > Reel::MAX_IMAGES
    images.each do |f|
      return fail_back("Each image must be ≤ #{MAX_IMAGE_BYTES / 1.megabyte} MB.") if f.size > MAX_IMAGE_BYTES
      return fail_back("All files must be images.") unless f.content_type.to_s.start_with?("image/")
    end

    Reel.transaction do
      reel.save!
      images.each_with_index do |file, idx|
        url = upload_to_cdn(file)
        raise ActiveRecord::Rollback if url.blank?
        reel.reel_images.create!(image_url: url, position: idx)
      end
    end

    if reel.persisted? && reel.reel_images.exists?
      audit!("reel.created", target: reel, label: @project.name, metadata: { project_id: @project.id, reel_id: reel.id, kind: reel.kind })
      redirect_to project_reels_path(@project), notice: "Carousel published."
    else
      fail_back("Upload failed. Try again.")
    end
  end

  def create_slideshow(reel)
    images = Array(params[:images]).reject(&:blank?)
    audio = params[:audio]

    return fail_back("Pick at least one image.") if images.empty?
    return fail_back("Up to #{Reel::MAX_IMAGES} images.") if images.size > Reel::MAX_IMAGES
    return fail_back("Add an audio track.") unless audio.respond_to?(:read) && audio.content_type.to_s.start_with?("audio/")
    return fail_back("Audio must be ≤ #{MAX_AUDIO_BYTES / 1.megabyte} MB.") if audio.size > MAX_AUDIO_BYTES

    images.each do |f|
      return fail_back("Each image must be ≤ #{MAX_IMAGE_BYTES / 1.megabyte} MB.") if f.size > MAX_IMAGE_BYTES
      return fail_back("All slides must be images.") unless f.content_type.to_s.start_with?("image/")
    end

    audio_url = upload_to_cdn(audio)
    return fail_back("Audio upload failed.") if audio_url.blank?
    reel.audio_url = audio_url
    reel.duration_seconds = params[:duration_seconds] if params[:duration_seconds].present?

    Reel.transaction do
      reel.save!
      images.each_with_index do |file, idx|
        url = upload_to_cdn(file)
        raise ActiveRecord::Rollback if url.blank?
        reel.reel_images.create!(image_url: url, position: idx)
      end
    end

    if reel.persisted? && reel.reel_images.exists?
      audit!("reel.created", target: reel, label: @project.name, metadata: { project_id: @project.id, reel_id: reel.id, kind: reel.kind })
      redirect_to project_reels_path(@project), notice: "Slideshow published."
    else
      fail_back("Upload failed. Try again.")
    end
  end

  def save_and_redirect(reel)
    if reel.save
      audit!("reel.created", target: reel, label: @project.name, metadata: { project_id: @project.id, reel_id: reel.id, kind: reel.kind })
      redirect_to project_reels_path(@project), notice: "Reel published."
    else
      fail_back(reel.errors.full_messages.to_sentence)
    end
  end

  def upload_to_cdn(file)
    HcCdnService.upload(io: file.tempfile, filename: file.original_filename, content_type: file.content_type)
  end

  def fail_back(message)
    redirect_to new_project_reel_path(@project), alert: message
  end

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
