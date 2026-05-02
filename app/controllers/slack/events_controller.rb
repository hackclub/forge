class Slack::EventsController < ApplicationController
  skip_before_action :verify_authenticity_token
  allow_unauthenticated_access

  before_action :verify_slack_request

  def create
    payload = JSON.parse(request.body.read)

    return render json: { challenge: payload["challenge"] } if payload["type"] == "url_verification"

    if payload["type"] == "event_callback"
      event_id = payload["event_id"]
      return head(:ok) if Rails.cache.read("slack_event:#{event_id}")
      Rails.cache.write("slack_event:#{event_id}", true, expires_in: 5.minutes)

      handle_event(payload["event"])
    end

    head :ok
  end

  private

  def handle_event(event)
    return unless event
    return unless event["type"] == "message"
    return if event["bot_id"].present?

    channel = event["channel"]

    if event["subtype"] == "message_changed"
      inner = event["message"] || {}
      return if inner["bot_id"].present?
      return if inner["subtype"].present?

      inner_ts = inner["ts"]
      return unless channel == forge_channel_id && inner["thread_ts"].blank? && inner_ts.present?
      return if Project.exists?(slack_message_ts: inner_ts)

      SlackPitchJob.perform_later(
        slack_user_id: inner["user"],
        channel_id: channel,
        message_ts: inner_ts,
        text: inner["text"]
      )
      return
    end

    return if event["subtype"].present?

    is_thread = event["thread_ts"].present?

    if !is_thread && channel == forge_channel_id
      SlackPitchJob.perform_later(
        slack_user_id: event["user"],
        channel_id: channel,
        message_ts: event["ts"],
        text: event["text"]
      )
    elsif !is_thread && channel == support_channel_id
      SupportTicketJob.perform_later(
        slack_user_id: event["user"],
        channel_id: channel,
        message_ts: event["ts"],
        text: event["text"],
        files: event["files"]
      )
    elsif is_thread && channel == support_channel_id
      SupportForwardJob.perform_later(
        slack_user_id: event["user"],
        channel_id: channel,
        thread_ts: event["thread_ts"],
        text: event["text"]
      )
    elsif is_thread && channel == bts_channel_id
      SupportRelayJob.perform_later(
        slack_user_id: event["user"],
        channel_id: channel,
        thread_ts: event["thread_ts"],
        text: event["text"]
      )
    end
  end

  def forge_channel_id
    ENV.fetch("SLACK_FORGE_CHANNEL_ID", "")
  end

  def support_channel_id
    ENV.fetch("SLACK_SUPPORT_CHANNEL_ID", "")
  end

  def bts_channel_id
    ENV.fetch("SLACK_BTS_CHANNEL_ID", "")
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
