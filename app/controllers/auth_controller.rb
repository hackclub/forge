class AuthController < ApplicationController
  allow_unauthenticated_access only: %i[ new create ]
  skip_before_action :redirect_banned_user!, only: %i[destroy]
  rate_limit to: 10, within: 3.minutes, only: :create, with: -> { redirect_to signin_path, alert: "Try again later." }

  def new
    state = SecureRandom.hex(24)
    session[:state] = state
    session[:referral_code] = params[:ref].to_s.strip.upcase if params[:ref].present?

    redirect_to HcaService.authorize_url(hca_callback_url, state), allow_other_host: true
  end

  def create
    if params[:state] != session[:state]
      Rails.logger.tagged("Authentication") do
        Rails.logger.error({
          event: "csrf_validation_failed",
          expected_state: session[:state],
          received_state: params[:state]
        }.to_json)
      end
      session[:state] = nil
      redirect_to root_path, alert: "Authentication failed due to CSRF token mismatch"
      return
    end

    begin
      user = User.exchange_hca_token(params[:code], hca_callback_url)
      session[:user_id] = user.id
      attribute_referral(user)

      Rails.logger.tagged("Authentication") do
        Rails.logger.info({
          event: "authentication_successful",
          user_id: user.id,
          email: user.email
        }.to_json)
      end

      AuditEvent.create!(
        actor: user,
        action: "auth.signed_in",
        target: user,
        target_label: user.display_name,
        ip_address: request.remote_ip,
        metadata: { is_staff: user.staff? }
      )

      redirect_to root_path, notice: "Welcome back, #{user.display_name}!"
    rescue StandardError => e
      Rails.logger.tagged("Authentication") do
        Rails.logger.error({
          event: "authentication_failed",
          error: e.message
        }.to_json)
      end
      redirect_to root_path, alert: e.message
    end
  end

  def destroy
    audit!("auth.signed_out", target: current_user) if current_user
    terminate_session
    redirect_to root_path, notice: "Signed out successfully. Cya!"
  end

  private

  def attribute_referral(user)
    code = session.delete(:referral_code)
    return if code.blank?
    return if user.referral_received.present?
    return if user.created_at < 2.minutes.ago

    referrer = User.find_by(referral_code: code)
    return if referrer.nil? || referrer.id == user.id

    Referral.create(referrer: referrer, referred: user, status: :pending)
  end
end
