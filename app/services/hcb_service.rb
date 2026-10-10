require "net/http"
require "faraday"
require "json"

module HcbService
  class Error < StandardError; end

  module_function

  ORG_SLUG = ENV.fetch("HCB_ORG_SLUG", "forge")
  HOST = "https://hcb.hackclub.com".freeze
  API_BASE = "#{HOST}/api/v3".freeze
  V4_BASE = "#{HOST}/api/v4/".freeze
  OAUTH_SCOPES = "read write".freeze
  CARD_GRANT_ID_PREFIX = "cdg_".freeze
  ACCESS_TOKEN_SETTING = "hcb_oauth_access_token".freeze
  REFRESH_TOKEN_SETTING = "hcb_oauth_refresh_token".freeze
  EXPIRES_AT_SETTING = "hcb_oauth_expires_at".freeze
  ACCOUNT_SETTING = "hcb_oauth_account".freeze
  TOKEN_REFRESH_LEEWAY = 60.seconds
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
      org_url: "#{HOST}/#{ORG_SLUG}"
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

  def client_id
    ENV.fetch("HCB_CLIENT_ID", nil)
  end

  def client_secret
    ENV.fetch("HCB_CLIENT_SECRET", nil)
  end

  def oauth_configured?
    client_id.present? && client_secret.present?
  end

  def connected?
    AppSetting.get(REFRESH_TOKEN_SETTING).present?
  end

  def authorize_url(redirect_uri, state)
    params = {
      client_id: client_id,
      redirect_uri: redirect_uri,
      response_type: "code",
      scope: OAUTH_SCOPES,
      state: state
    }
    "#{V4_BASE}oauth/authorize?#{params.to_query}"
  end

  def connect!(code, redirect_uri, connected_by:)
    raise Error, "HCB OAuth isn't configured — set HCB_CLIENT_ID and HCB_CLIENT_SECRET." unless oauth_configured?
    raise Error, "HCB didn't return an authorization code." if code.blank?

    store_tokens(request_token(grant_type: "authorization_code", code: code, redirect_uri: redirect_uri))
    account = me
    AppSetting.set(ACCOUNT_SETTING, {
      hcb_user_id: account["id"],
      name: account["name"],
      email: account["email"],
      connected_by_id: connected_by.id,
      connected_at: Time.current.iso8601
    }.to_json)
    account
  end

  def disconnect!
    revoke_token if connected?
    [ ACCESS_TOKEN_SETTING, REFRESH_TOKEN_SETTING, EXPIRES_AT_SETTING, ACCOUNT_SETTING ].each { |key| AppSetting.clear(key) }
  end

  def connection_status
    account = JSON.parse(AppSetting.get(ACCOUNT_SETTING).presence || "{}")
    connected_at = account["connected_at"].present? ? Time.zone.parse(account["connected_at"]) : nil

    {
      configured: oauth_configured?,
      connected: connected?,
      org_slug: ORG_SLUG,
      org_url: "#{HOST}/#{ORG_SLUG}",
      account_name: account["name"],
      account_email: account["email"],
      connected_at: connected_at&.strftime("%b %d, %Y %H:%M")
    }
  end

  def me
    v4_get("user")
  end

  def test_connection!
    ensure_connected!
    me
  end

  def create_card_grant!(order)
    amount_cents = order.grant_amount_cents
    raise Error, "This order has no dollar amount to grant." unless amount_cents.to_i.positive?

    issue_card_grant!(
      amount_cents: amount_cents,
      email: order.user.email,
      purpose: order.grant_purpose,
      instructions: order.grant_description
    )
  end

  def issue_card_grant!(amount_cents:, email:, purpose:, instructions:)
    body = {
      amount_cents: amount_cents,
      email: email,
      purpose: purpose,
      instructions: instructions
    }.compact_blank

    serialize_card_grant(v4_post("organizations/#{ORG_SLUG}/card_grants", body))
  end

  def fetch_card_grant(public_id)
    serialize_card_grant(v4_get("card_grants/#{public_id}?expand=balance_cents"))
  end

  def cancel_card_grant!(public_id)
    serialize_card_grant(v4_post("card_grants/#{public_id}/cancel", {}))
  end

  def serialize_card_grant(grant)
    {
      id: grant["id"],
      link: grant_link(grant["id"]),
      status: grant["status"],
      amount_cents: grant["amount_cents"],
      balance_cents: grant["balance_cents"]
    }
  end

  def grant_link(public_id)
    "#{HOST}/grants/#{public_id.to_s.delete_prefix(CARD_GRANT_ID_PREFIX)}"
  end

  def grant_public_id(link)
    match = URI.parse(link.to_s.strip).path.to_s.match(%r{\A/grants/([A-Za-z0-9]+)/?\z})
    match && "#{CARD_GRANT_ID_PREFIX}#{match[1]}"
  rescue URI::InvalidURIError
    nil
  end

  def access_token
    ensure_connected!
    return AppSetting.get(ACCESS_TOKEN_SETTING) if token_fresh?

    refresh_access_token!
  end

  def token_fresh?
    expires_at = AppSetting.get(EXPIRES_AT_SETTING)
    return false if expires_at.blank? || AppSetting.get(ACCESS_TOKEN_SETTING).blank?

    Time.zone.parse(expires_at) > TOKEN_REFRESH_LEEWAY.from_now
  end

  def refresh_access_token!
    AppSetting.transaction do
      AppSetting.lock.find_by(key: REFRESH_TOKEN_SETTING)

      if token_fresh?
        AppSetting.get(ACCESS_TOKEN_SETTING)
      else
        tokens = request_token(grant_type: "refresh_token", refresh_token: AppSetting.get(REFRESH_TOKEN_SETTING))
        store_tokens(tokens)
        tokens["access_token"]
      end
    end
  end

  def ensure_connected!
    raise Error, "HCB isn't connected — connect an HCB account from Admin → API keys." unless connected?
  end

  def request_token(**params)
    response = v4_connection.post("oauth/token", params.merge(client_id: client_id, client_secret: client_secret).to_json)
    body = parse_json(response.body)
    return body if response.success? && body["access_token"].present?

    if body["error"] == "invalid_grant"
      raise Error, "The HCB connection has expired or was revoked — reconnect HCB from Admin → API keys."
    end

    raise Error, "HCB token request failed (#{response.status}): #{body['error_description'] || body['error'] || 'unknown error'}"
  end

  def store_tokens(tokens)
    AppSetting.set(ACCESS_TOKEN_SETTING, tokens["access_token"])
    AppSetting.set(REFRESH_TOKEN_SETTING, tokens["refresh_token"]) if tokens["refresh_token"].present?
    AppSetting.set(EXPIRES_AT_SETTING, (Time.current + tokens["expires_in"].to_i.seconds).iso8601)
  end

  def revoke_token
    v4_post("user/revoke", {})
  rescue StandardError => e
    Rails.logger.warn("HcbService revoke failed: #{e.class}: #{e.message}")
  end

  def v4_get(path)
    token = access_token
    handle_v4_response(v4_connection.get(path) { |req| req.headers["Authorization"] = "Bearer #{token}" })
  end

  def v4_post(path, body)
    token = access_token
    handle_v4_response(v4_connection.post(path, body.to_json) { |req| req.headers["Authorization"] = "Bearer #{token}" })
  end

  def handle_v4_response(response)
    body = parse_json(response.body)
    return body if response.success?

    messages = Array(body["messages"]).compact_blank
    messages = [ body["error"].presence || "unknown error" ] if messages.empty?
    raise Error, "HCB request failed (#{response.status}): #{messages.join(', ')}"
  end

  def parse_json(raw)
    parsed = JSON.parse(raw.to_s.presence || "{}")
    parsed.is_a?(Hash) ? parsed : {}
  rescue JSON::ParserError
    {}
  end

  def v4_connection
    @v4_connection ||= Faraday.new(url: V4_BASE) do |f|
      f.headers["Content-Type"] = "application/json"
      f.headers["Accept"] = "application/json"
      f.options.timeout = READ_TIMEOUT
      f.options.open_timeout = OPEN_TIMEOUT
      f.adapter Faraday.default_adapter
    end
  end
end
