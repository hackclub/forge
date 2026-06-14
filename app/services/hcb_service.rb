require "net/http"
require "json"

module HcbService
  module_function

  ORG_SLUG = ENV.fetch("HCB_ORG_SLUG", "forge")
  API_BASE = "https://hcb.hackclub.com/api/v3".freeze
  OPEN_TIMEOUT = 5
  READ_TIMEOUT = 10

  def summary
    org = fetch_org
    return nil unless org.is_a?(Hash)

    balances = org["balances"] || {}
    {
      balance_usd: cents_to_usd(balances["balance_cents"]),
      incoming_usd: cents_to_usd(balances["incoming_balance_cents"]),
      total_raised_usd: cents_to_usd(balances["total_raised"]),
      org_url: "https://hcb.hackclub.com/#{ORG_SLUG}"
    }
  end

  def fetch_org
    Rails.cache.fetch("hcb/org/#{ORG_SLUG}", expires_in: 5.minutes, skip_nil: true) do
      get_org
    end
  end

  def get_org
    uri = URI("#{API_BASE}/organizations/#{ORG_SLUG}")
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true
    http.open_timeout = OPEN_TIMEOUT
    http.read_timeout = READ_TIMEOUT
    response = http.get(uri.request_uri, "Accept" => "application/json")
    return nil unless response.is_a?(Net::HTTPSuccess)

    JSON.parse(response.body)
  rescue StandardError => e
    Rails.logger.error("HcbService failed: #{e.class}: #{e.message}")
    nil
  end

  def cents_to_usd(cents)
    (cents.to_i / 100.0).round(2)
  end
end
