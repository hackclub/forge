class SlackContributorsPingJob < ApplicationJob
  queue_as :background

  PING_MESSAGE = <<~TEXT.freeze
    Hey! If you're in this channel you've contributed or done anything for Forge in any way :P

    From today, after an insightful convo with kc, I would like everyone to post what they did weekly in my weekly channel ping threads! This doesn't impact your position or what you do or anything, however it just lets me gauge what's cooking with Forge and helps motivate others!! Even if you didn't do anything for the week chuck it in the thread! Does not matter

    On top of this please list something you liked about Forge and something that could be improved about Forge and any hurdles you faced in getting your tasks done, for example if you are a reviewer for Forge — what stopped or slowed you down from reviewing this week. This basically lets me see how I can help solve those hurdles especially since we have a big launch coming up really soon!

    Draft your message like this:

    Today I did - _____________________
    What I liked about Forge this week - _____________________
    What could improve about Forge - ___________________
    Problems I had with fulfilling my role this week - ___________________

    lets forge it :D
  TEXT

  def perform
    channel = ENV.fetch("SLACK_CONTRIBUTORS_CHANNEL_ID", nil)
    return if channel.blank?

    client = Slack::Web::Client.new(token: ENV.fetch("SLACK_BOT_TOKEN", nil))
    response = client.chat_postMessage(channel: channel, text: "<!channel> #{PING_MESSAGE}")
    client.chat_postMessage(channel: channel, thread_ts: response["ts"], text: ContributorStats.slack_message)
  rescue StandardError => e
    Rails.logger.error("SlackContributorsPingJob failed: #{e.message}")
    raise
  end
end
