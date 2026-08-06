class SlackContributorsPingJob < ApplicationJob
  queue_as :background

  MENTIONS_PER_MESSAGE = 40

  PING_MESSAGE = <<~TEXT.freeze
    hello forgers! it's time for the weekly check-in :P

    if you're in this channel you've contributed or done something for forge in some way. post what you did this week in the thread below! this doesn't impact your position or what you do or anything, it just lets me gauge what's cooking with forge and helps motivate others!! even if you didn't do anything this week chuck it in the thread! does not matter

    on top of this please list something you liked about forge, something that could be improved about forge, and any hurdles you faced in getting your tasks done. for example if you are a reviewer for forge, what stopped or slowed you down from reviewing this week? this lets me see how i can help solve those hurdles, especially since we have a big launch coming up really soon!

    draft your message like this:

    today i did - _____________________
    what i liked about forge this week - _____________________
    what could improve about forge - ___________________
    problems i had with fulfilling my role this week - ___________________

    lets forge it :D
  TEXT

  def perform
    channel = ENV.fetch("SLACK_CONTRIBUTORS_CHANNEL_ID", nil)
    return if channel.blank?

    client = Slack::Web::Client.new(token: ENV.fetch("SLACK_BOT_TOKEN", nil))
    response = client.chat_postMessage(channel: channel, text: PING_MESSAGE)
    client.chat_postMessage(channel: channel, thread_ts: response["ts"], text: ContributorStats.slack_message)
    ping_members(client, channel, response["ts"])
  rescue StandardError => e
    Rails.logger.error("SlackContributorsPingJob failed: #{e.message}")
    raise
  end

  private

  def ping_members(client, channel, thread_ts)
    bot_user_id = client.auth_test["user_id"]
    member_ids = []
    cursor = nil
    loop do
      page = client.conversations_members(channel: channel, cursor: cursor, limit: 200)
      member_ids.concat(page["members"])
      cursor = page.dig("response_metadata", "next_cursor")
      break if cursor.blank?
    end

    (member_ids - [ bot_user_id ]).each_slice(MENTIONS_PER_MESSAGE) do |batch|
      client.chat_postMessage(
        channel: channel,
        thread_ts: thread_ts,
        text: "cc #{batch.map { |id| "<@#{id}>" }.join(" ")}"
      )
    end
  end
end
