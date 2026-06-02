class SlackReelNotifyJob < ApplicationJob
  queue_as :default

  def perform(reel_id)
    channel_id = ENV.fetch("SLACK_REELS_CHANNEL_ID", "").to_s.strip
    return if channel_id.blank?

    reel = Reel.includes(:user, :project, :reel_images).find_by(id: reel_id)
    return unless reel
    return if reel.user.nil? || reel.user.is_banned

    app_url = ENV.fetch("APP_URL", "https://forge.hackclub.com")
    reel_url = "#{app_url}/reels/#{reel.id}"
    title = reel.title.presence || reel.project.name
    user_mention = reel.user.slack_id.present? ? "<@#{reel.user.slack_id}>" : reel.user.display_name
    preview_url = preview_image_for(reel)

    fallback = ":fire: New awesome reel submitted by #{user_mention} — #{reel_url}"

    blocks = [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: ":fire: New awesome reel submitted by #{user_mention}\n*<#{reel_url}|#{escape(title)}>* — from *#{escape(reel.project.name)}*"
        }
      }
    ]
    if preview_url.present?
      blocks << { type: "image", image_url: preview_url, alt_text: title.to_s.truncate(150) }
    end

    client = Slack::Web::Client.new(token: ENV.fetch("SLACK_BOT_TOKEN", nil))
    client.chat_postMessage(
      channel: channel_id,
      text: fallback,
      blocks: blocks,
      unfurl_links: false,
      unfurl_media: false
    )
  rescue StandardError => e
    Rails.logger.error("SlackReelNotifyJob failed for reel #{reel_id}: #{e.class}: #{e.message}")
  end

  private

  def preview_image_for(reel)
    case reel.kind
    when "video"
      reel.project.cover_image_url
    else
      reel.reel_images.min_by(&:position)&.image_url || reel.project.cover_image_url
    end
  end

  def escape(str)
    str.to_s.gsub("&", "&amp;").gsub("<", "&lt;").gsub(">", "&gt;")
  end
end
