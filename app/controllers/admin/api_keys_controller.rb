class Admin::ApiKeysController < Admin::ApplicationController
  before_action :require_superadmin!

  PROVIDERS = {
    "claude" => {
      label: "Claude",
      credential_source: -> { AiRequirementsChecker.credential_source },
      model: -> { AiRequirementsChecker.model },
      setting_key: AiRequirementsChecker::AUTH_TOKEN_SETTING,
      test: ->(token) { AiRequirementsChecker.test_connection!(token) }
    },
    "macondo" => {
      label: "Macondo",
      credential_source: -> { MacondoService.enabled? ? "admin_key" : "none" },
      model: nil,
      setting_key: MacondoService::API_KEY_SETTING,
      test: ->(token) { MacondoService.test_connection!(token) }
    }
  }.freeze

  def index
    render inertia: "Admin/ApiKeys/Show", props: {
      providers: PROVIDERS.map { |id, cfg| provider_payload(id, cfg) }
    }
  end

  def update
    provider = PROVIDERS.fetch(params[:id]) { return not_found! }
    token = params[:token].to_s.strip
    return redirect_to admin_api_keys_path, alert: "Paste a key first." if token.blank?

    begin
      provider[:test].call(token)
    rescue StandardError => e
      return redirect_to admin_api_keys_path, alert: e.message
    end

    AppSetting.set(provider[:setting_key], token)
    audit!("#{params[:id]}.reauthed", metadata: { token_digest: Digest::SHA256.hexdigest(token).first(12) })
    redirect_to admin_api_keys_path, notice: "#{provider[:label]} key verified and saved."
  end

  def test
    provider = PROVIDERS.fetch(params[:id]) { return not_found! }
    provider[:test].call(nil)
    redirect_to admin_api_keys_path, notice: "#{provider[:label]} connection is working."
  rescue StandardError => e
    redirect_to admin_api_keys_path, alert: e.message
  end

  def destroy
    provider = PROVIDERS.fetch(params[:id]) { return not_found! }
    AppSetting.clear(provider[:setting_key])
    audit!("#{params[:id]}.token_cleared")
    redirect_to admin_api_keys_path, notice: "#{provider[:label]} key cleared."
  end

  private

  def not_found!
    raise ActionController::RoutingError, "Not Found"
  end

  def provider_payload(id, cfg)
    {
      id: id,
      label: cfg[:label],
      credential_source: cfg[:credential_source].call,
      model: cfg[:model]&.call,
      token_saved_at: AppSetting.updated_at_for(cfg[:setting_key])&.strftime("%b %d, %Y %H:%M")
    }
  end

  def require_superadmin!
    require_permission!("superadmin")
  end
end
