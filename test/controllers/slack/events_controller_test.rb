require "test_helper"

class Slack::EventsControllerTest < ActionDispatch::IntegrationTest
  SIGNING_SECRET = "test-signing-secret".freeze
  SUPPORT_CHANNEL = "C_SUPPORT".freeze
  FORGE_CHANNEL = "C_FORGE".freeze

  setup do
    ENV["SLACK_SIGNING_SECRET"] = SIGNING_SECRET
    ENV["SLACK_SUPPORT_CHANNEL_ID"] = SUPPORT_CHANNEL
    ENV["SLACK_FORGE_CHANNEL_ID"] = FORGE_CHANNEL
    Rails.cache.clear
  end

  def post_event(event, event_id: SecureRandom.hex(6))
    body = { type: "event_callback", event_id: event_id, event: event }.to_json
    timestamp = Time.now.to_i.to_s
    signature = "v0=#{OpenSSL::HMAC.hexdigest('SHA256', SIGNING_SECRET, "v0:#{timestamp}:#{body}")}"

    post slack_events_path,
      params: body,
      headers: {
        "CONTENT_TYPE" => "application/json",
        "X-Slack-Request-Timestamp" => timestamp,
        "X-Slack-Signature" => signature
      }
  end

  def image_event(overrides = {})
    {
      "type" => "message",
      "subtype" => "file_share",
      "channel" => SUPPORT_CHANNEL,
      "user" => "U123",
      "ts" => "1712345678.000100",
      "text" => "my board wont boot",
      "files" => [ { "permalink" => "https://files.slack.com/x.png", "name" => "board.png" } ]
    }.merge(overrides)
  end

  test "an image posted in the help channel opens a ticket" do
    assert_enqueued_with(job: SupportTicketJob) do
      post_event(image_event)
    end

    assert_response :success
  end

  test "the uploaded files are handed to the job" do
    assert_enqueued_jobs 1, only: SupportTicketJob do
      post_event(image_event)
    end

    enqueued = enqueued_jobs.find { |j| j["job_class"] == "SupportTicketJob" || j[:job] == SupportTicketJob }
    args = enqueued["arguments"].first.symbolize_keys
    assert_equal "1712345678.000100", args[:message_ts]
    assert_equal 1, args[:files].length
    assert_equal "https://files.slack.com/x.png", args[:files].first["permalink"]
  end

  test "an image with no caption still opens a ticket" do
    assert_enqueued_jobs 1, only: SupportTicketJob do
      post_event(image_event("text" => ""))
    end
  end

  test "plain text in the help channel still opens a ticket" do
    assert_enqueued_jobs 1, only: SupportTicketJob do
      post_event(image_event.except("subtype", "files"))
    end
  end

  test "an image replying inside a thread does not open a ticket" do
    assert_no_enqueued_jobs only: SupportTicketJob do
      post_event(image_event("thread_ts" => "1712345600.000001"))
    end
  end

  test "other message subtypes are still ignored" do
    assert_no_enqueued_jobs only: SupportTicketJob do
      post_event(image_event("subtype" => "channel_join", "files" => nil))
    end
  end

  test "an image in the pitch channel does not open a support ticket" do
    assert_no_enqueued_jobs only: SupportTicketJob do
      post_event(image_event("channel" => FORGE_CHANNEL))
    end
  end

  test "bot uploads are ignored" do
    assert_no_enqueued_jobs only: SupportTicketJob do
      post_event(image_event("bot_id" => "B123"))
    end
  end
end
