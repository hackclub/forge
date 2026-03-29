class Slack::EventsController < ApplicationController
  skip_before_action :verify_authenticity_token
  allow_unauthenticated_access

  before_action :verify_slack_request

  def create
    payload = JSON.parse(request.body.read)

    case payload["type"]
    when "url_verification"
      render json: { challenge: payload["challenge"] }
    when "event_callback"
      handle_event(payload["event"])
      head :ok
    else
      head :ok
    end
  end

  private

  def handle_event(event)
    return unless event
    return unless event["type"] == "message"
    return if event["subtype"].present?
    return if event["bot_id"].present?
    return if event["thread_ts"].present?
    return unless event["channel"] == forge_channel_id

    SlackPitchJob.perform_later(
      slack_user_id: event["user"],
      channel_id: event["channel"],
      message_ts: event["ts"],
      text: event["text"]
    )
  end

  def forge_channel_id
    ENV.fetch("SLACK_FORGE_CHANNEL_ID", "")
  end

  def verify_slack_request
    signing_secret = ENV.fetch("SLACK_SIGNING_SECRET", "")
    return head(:unauthorized) if signing_secret.blank?

    timestamp = request.headers["X-Slack-Request-Timestamp"]
    return head(:unauthorized) if timestamp.blank?
    return head(:unauthorized) if (Time.now.to_i - timestamp.to_i).abs > 300

    request.body.rewind
    body = request.body.read
    request.body.rewind

    sig_basestring = "v0:#{timestamp}:#{body}"
    my_signature = "v0=#{OpenSSL::HMAC.hexdigest("SHA256", signing_secret, sig_basestring)}"
    slack_signature = request.headers["X-Slack-Signature"]

    head(:unauthorized) unless ActiveSupport::SecurityUtils.secure_compare(my_signature, slack_signature.to_s)
  end
end
