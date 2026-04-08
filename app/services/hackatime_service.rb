require "faraday"
require "json"

module HackatimeService
  module_function

  BASE_URL = "https://hackatime.hackclub.com/api/admin/v1"

  def api_key
    ENV.fetch("HACKATIME_ADMIN_API_KEY", nil)
  end

  def enabled?
    api_key.present?
  end

  def get_user_by_email(email)
    return nil unless enabled?

    response = connection.post("user/get_user_by_email") do |req|
      req.body = { email: email }.to_json
    end

    return nil unless response.success?

    data = JSON.parse(response.body)
    data["user_id"]
  rescue StandardError => e
    Rails.logger.error("HackatimeService.get_user_by_email failed: #{e.message}")
    nil
  end

  def get_user_info(user_id)
    return nil unless enabled?

    response = connection.get("user/info", id: user_id)
    return nil unless response.success?

    JSON.parse(response.body).dig("user")
  rescue StandardError => e
    Rails.logger.error("HackatimeService.get_user_info failed: #{e.message}")
    nil
  end

  def get_user_by_slack_id(slack_id)
    return nil unless enabled? && slack_id.present?

    response = connection.post("user/search_fuzzy") do |req|
      req.body = { query: slack_id }.to_json
    end

    return nil unless response.success?

    data = JSON.parse(response.body)
    rows = data["rows"]
    return nil if rows.blank?

    match = rows.find { |r| r["slack_uid"] == slack_id }
    match&.dig("id")
  rescue StandardError => e
    Rails.logger.error("HackatimeService.get_user_by_slack_id failed: #{e.message}")
    nil
  end

  def get_trust_info(slack_id:, email:)
    return nil unless enabled?

    user_id = get_user_by_slack_id(slack_id) || get_user_by_email(email)
    return nil unless user_id

    get_user_info(user_id)
  end

  def connection
    @connection = nil if Rails.env.test?
    @connection ||= Faraday.new(url: BASE_URL) do |f|
      f.headers["Authorization"] = "Bearer #{api_key}"
      f.headers["Content-Type"] = "application/json"
      f.adapter Faraday.default_adapter
      f.options.timeout = 10
      f.options.open_timeout = 5
    end
  end
end
