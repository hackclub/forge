class SlackForgeChannelInviteJob < ApplicationJob
  queue_as :background

  CHANNEL_ID = "C0ALJ6P00B1".freeze
  BATCH_SIZE = 100

  def perform(dry_run: false)
    members = current_members
    left = users_who_left

    slack_ids = User.kept.where(is_banned: false).where.not(slack_id: [ nil, "" ]).distinct.pluck(:slack_id)
    to_invite = slack_ids - members.to_a - left.to_a

    Rails.logger.info(
      "SlackForgeChannelInviteJob: #{slack_ids.size} users, #{members.size} already in channel, " \
      "#{left.size} left before, #{dry_run ? 'would invite' : 'inviting'} #{to_invite.size}"
    )
    return to_invite if dry_run

    to_invite.each_slice(BATCH_SIZE) do |batch|
      slack_client.conversations_invite(channel: CHANNEL_ID, users: batch.join(","))
    rescue Slack::Web::Api::Errors::SlackError => e
      Rails.logger.warn("SlackForgeChannelInviteJob batch failed: #{e.message}")
      raise unless %w[already_in_channel cant_invite cant_invite_self user_not_found].include?(e.message)
    end

    to_invite
  end

  private

  def current_members
    members = Set.new
    slack_client.conversations_members(channel: CHANNEL_ID, limit: 1000) { |page| members.merge(page.members) }
    members
  end

  def users_who_left
    left = Set.new
    slack_client.conversations_history(channel: CHANNEL_ID, limit: 999) do |page|
      page.messages.each { |message| left << message.user if message.subtype == "channel_leave" }
    end
    left
  end

  def slack_client
    @slack_client ||= Slack::Web::Client.new(token: ENV.fetch("SLACK_BOT_TOKEN", nil))
  end
end
