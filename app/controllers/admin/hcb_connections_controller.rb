class Admin::HcbConnectionsController < Admin::ApplicationController
  before_action :require_superadmin!

  def new
    unless HcbService.oauth_configured?
      redirect_to admin_api_keys_path, alert: "Set HCB_CLIENT_ID and HCB_CLIENT_SECRET before connecting HCB."
      return
    end

    state = SecureRandom.hex(24)
    session[:hcb_oauth_state] = state
    redirect_to HcbService.authorize_url(hcb_callback_url, state), allow_other_host: true
  end

  def create
    expected_state = session.delete(:hcb_oauth_state)
    if expected_state.blank? || params[:state] != expected_state
      audit!("hcb.connect_failed", metadata: { reason: "state_mismatch" })
      redirect_to admin_api_keys_path, alert: "HCB connection failed: state mismatch. Try again."
      return
    end

    if params[:error].present?
      audit!("hcb.connect_failed", metadata: { reason: params[:error].to_s })
      redirect_to admin_api_keys_path, alert: "HCB connection was denied (#{params[:error]})."
      return
    end

    account = HcbService.connect!(params[:code], hcb_callback_url, connected_by: current_user)
    audit!("hcb.connected", metadata: { hcb_user_id: account["id"], hcb_email: account["email"], hcb_name: account["name"] })
    redirect_to admin_api_keys_path, notice: "HCB connected as #{account['name'] || account['email']}."
  rescue HcbService::Error => e
    audit!("hcb.connect_failed", metadata: { reason: e.message })
    redirect_to admin_api_keys_path, alert: e.message
  end

  def test
    account = HcbService.test_connection!
    redirect_to admin_api_keys_path, notice: "HCB connection is working (#{account['email'] || account['name']})."
  rescue HcbService::Error => e
    redirect_to admin_api_keys_path, alert: e.message
  end

  def destroy
    HcbService.disconnect!
    audit!("hcb.disconnected")
    redirect_to admin_api_keys_path, notice: "HCB disconnected."
  end

  private

  def require_superadmin!
    require_permission!("superadmin")
  end
end
