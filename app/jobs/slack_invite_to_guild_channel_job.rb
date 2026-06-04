class SlackInviteToGuildChannelJob < ApplicationJob
  queue_as :default

  def perform(user_id)
    return unless FeatureFlag.enabled?("guilds")

    user = User.find_by(id: user_id)
    return unless user&.slack_id.present?
    return unless user.joined_guild?

    channel_id = ENV.fetch("SLACK_GUILD_#{user.guild.upcase}_CHANNEL_ID", nil)
    return if channel_id.blank?

    slack_client.conversations_invite(channel: channel_id, users: user.slack_id)
  rescue Slack::Web::Api::Errors::SlackError => e
    return if %w[already_in_channel cant_invite_self].include?(e.message)

    Rails.logger.warn("SlackInviteToGuildChannelJob failed for user #{user&.id}: #{e.message}")
    raise unless e.message == "missing_scope"
  end

  private

  def slack_client
    @slack_client ||= Slack::Web::Client.new(token: ENV.fetch("SLACK_BOT_TOKEN", nil))
  end
end
