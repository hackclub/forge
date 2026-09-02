require "faraday"
require "json"

module MacondoService
  module_function

  API_KEY_SETTING = "macondo_api_key"
  BASE_URL = "https://macondo.hackclub.com/api"
  URL_PATTERN = %r{macondo\.hackclub\.com/projects/([a-zA-Z0-9_-]+)}

  def api_key
    AppSetting.get(API_KEY_SETTING)
  end

  def enabled?
    api_key.present?
  end

  def parse_project_id(url)
    url.to_s[URL_PATTERN, 1]
  end

  def get_project(id)
    return nil unless enabled? && id.present?

    response = connection.get("projects/#{id}")
    return nil unless response.success?

    JSON.parse(response.body)
  rescue StandardError => e
    Rails.logger.error("MacondoService.get_project failed: #{e.message}")
    nil
  end

  def get_journals(id)
    return [] unless enabled? && id.present?

    response = connection.get("projects/#{id}/journals")
    return [] unless response.success?

    JSON.parse(response.body)
  rescue StandardError => e
    Rails.logger.error("MacondoService.get_journals failed: #{e.message}")
    []
  end

  def shipped?(project_json)
    project_json["hasPreviousShippedShip"] == true || project_json["activeShip"].present?
  end

  # The Get Project response includes an `owner` object; match it against the
  # Forge user attempting the import so nobody can import someone else's project.
  def owned_by?(project_json, user)
    owner = project_json["owner"]
    return false if owner.blank? || user.nil?

    owner["slack_id"].present? && owner["slack_id"] == user.slack_id
  end

  def test_connection!(token_override = nil)
    key = token_override.presence || api_key
    raise "No Macondo key configured." if key.blank?

    response = Faraday.new(url: BASE_URL).get("explore/projects") do |req|
      req.headers["Authorization"] = "Bearer #{key}"
      req.params[:limit] = 1
    end
    raise "Macondo rejected the key (#{response.status})." unless response.success?
  end

  def connection
    @connection = nil if Rails.env.test?
    @connection ||= Faraday.new(url: BASE_URL) do |f|
      f.headers["Authorization"] = "Bearer #{api_key}"
      f.adapter Faraday.default_adapter
      f.options.timeout = 10
      f.options.open_timeout = 5
    end
  end
end
