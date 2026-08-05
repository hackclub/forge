class SlackContributorsInviteJob < ApplicationJob
  queue_as :background

  CONTRIBUTOR_ROLES = %w[admin reviewer support fulfillment].freeze

  def perform(user_id = nil)
    channel = ENV.fetch("SLACK_CONTRIBUTORS_CHANNEL_ID", nil)
    return if channel.blank?

    scope = User.kept.where.not(slack_id: nil).where("roles && ARRAY[?]::varchar[]", CONTRIBUTOR_ROLES)
    scope = scope.where(id: user_id) if user_id

    client = Slack::Web::Client.new(token: ENV.fetch("SLACK_BOT_TOKEN", nil))
    scope.find_each do |user|
      client.conversations_invite(channel: channel, users: user.slack_id)
    rescue Slack::Web::Api::Errors::SlackError => e
      next if %w[already_in_channel cant_invite_self].include?(e.message)

      Rails.logger.warn("SlackContributorsInviteJob failed for user #{user.id}: #{e.message}")
      raise unless %w[missing_scope user_not_found cant_invite].include?(e.message)
    end
  end
end
