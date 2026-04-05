require "faraday"
require "json"

module HcCdnService
  class Error < StandardError; end

  module_function

  ENDPOINT = "https://cdn.hackclub.com/api/v3/new".freeze

  def token
    ENV.fetch("HC_CDN_TOKEN", nil)
  end

  def enabled?
    token.present?
  end

  def mirror(url)
    return nil unless enabled?
    return nil if url.blank?

    response = Faraday.post(ENDPOINT) do |req|
      req.headers["Authorization"] = "Bearer #{token}"
      req.headers["Content-Type"] = "application/json"
      req.body = [ url ].to_json
    end

    unless response.success?
      Rails.logger.error("HC CDN mirror failed: #{response.status} - #{response.body}")
      return nil
    end

    data = JSON.parse(response.body)
    data.dig("files", 0, "deployedUrl")
  rescue StandardError => e
    Rails.logger.error("HC CDN mirror error: #{e.class}: #{e.message}")
    nil
  end
end
