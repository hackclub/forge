require "faraday"
require "json"

module NdaService
  module_function

  BASE_URL = "https://nda.hackclub.com/api/v1"
  CACHE_TTL = 5.minutes
  REQUEST_INTERVAL = 0.15

  def status(slack_id)
    return { status: "unknown" } if slack_id.blank?

    Rails.cache.fetch(cache_key(slack_id), expires_in: CACHE_TTL, skip_nil: true) do
      sleep(REQUEST_INTERVAL)
      fetch_status(slack_id)
    end || { status: "unknown" }
  end

  def clear_cache(slack_ids)
    slack_ids.compact_blank.each { |id| Rails.cache.delete(cache_key(id)) }
  end

  def fetch_status(slack_id)
    response = connection.get("nda_status/#{slack_id}")
    return nil unless response.success?

    data = JSON.parse(response.body)
    { status: data["status"], nda_version: data["nda_version"], signed_at: data["signed_at"] }
  rescue StandardError => e
    Rails.logger.error("NdaService.fetch_status failed: #{e.message}")
    nil
  end

  def cache_key(slack_id)
    "nda_status/#{slack_id.to_s.upcase}"
  end

  def connection
    @connection = nil if Rails.env.test?
    @connection ||= Faraday.new(url: BASE_URL) do |f|
      f.adapter Faraday.default_adapter
      f.options.timeout = 10
      f.options.open_timeout = 5
    end
  end
end
