class SlackInviteToBetaChannelJob < ApplicationJob
  queue_as :default

  CHANNEL_ID = "C0AQXF6LVQS".freeze

  def perform(user_id)
    user = User.find_by(id: user_id)
    return unless user&.slack_id.present?

    slack_client.conversations_invite(channel: CHANNEL_ID, users: user.slack_id)
  rescue Slack::Web::Api::Errors::SlackError => e
    raise unless %w[already_in_channel cant_invite_self].include?(e.message)
  end

  private

  def slack_client
    @slack_client ||= Slack::Web::Client.new(token: ENV.fetch("SLACK_BOT_TOKEN", nil))
  end
end
