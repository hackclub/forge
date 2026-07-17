require "net/http"

class SettingsController < ApplicationController
  AVATAR_FALLBACK = "/static-assets/pfp_fallback.webp"
  AVATAR_REDIRECT_LIMIT = 3

  def show
    user = current_user

    render inertia: "Settings/Show", props: {
      user: {
        id: user.id,
        display_name: user.display_name,
        email: user.email,
        avatar: user.avatar,
        github_username: user.github_username,
        git_provider: user.git_provider || "github"
      },
      address: user.address_line1.present? ? {
        address_line1: user.address_line1,
        address_line2: user.address_line2,
        city: user.city,
        state: user.state,
        country: user.country,
        postal_code: user.postal_code,
        phone_number: user.phone_number
      } : nil,
      hca_address_portal_url: HcaService.address_portal_url(return_to: settings_url)
    }
  end

  def avatar_proxy
    avatar = current_user.avatar.to_s
    return redirect_to(avatar.presence || AVATAR_FALLBACK) unless avatar.start_with?("http://", "https://")

    candidates = [ upscaled_slack_avatar(avatar), avatar ].uniq
    response = candidates.lazy.map { |url| fetch_avatar(url) rescue nil }.find { |r| r.is_a?(Net::HTTPSuccess) }
    if response
      expires_in 5.minutes
      send_data response.body, type: response.content_type.presence || "image/png", disposition: "inline"
    else
      redirect_to AVATAR_FALLBACK
    end
  rescue StandardError => e
    Rails.logger.warn("avatar_proxy failed: #{e.class}: #{e.message}")
    redirect_to AVATAR_FALLBACK
  end

  private

  def upscaled_slack_avatar(url)
    return url unless URI(url).host == "avatars.slack-edge.com"

    url.sub(/_(?:24|32|48|72|192)(\.\w+)\z/, '_512\1')
  rescue URI::InvalidURIError
    url
  end

  def fetch_avatar(url)
    response = nil
    AVATAR_REDIRECT_LIMIT.times do
      uri = URI(url)
      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = uri.scheme == "https"
      http.open_timeout = 5
      http.read_timeout = 10
      response = http.get(uri.request_uri)
      break unless response.is_a?(Net::HTTPRedirection)

      url = URI.join(url, response["location"]).to_s
    end
    response
  end
end
