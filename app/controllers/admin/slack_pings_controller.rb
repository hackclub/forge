class Admin::SlackPingsController < Admin::ApplicationController
  before_action :require_admin!

  def index
    stats = ContributorStats.weekly_summary
    render inertia: "Admin/SlackPings/Index", props: {
      contributors_channel_configured: ENV["SLACK_CONTRIBUTORS_CHANNEL_ID"].present?,
      forge_channel_configured: ENV["SLACK_FORGE_CHANNEL_ID"].present?,
      stats_preview: ContributorStats.slack_message(stats),
      recent_breaks: StreakBreakNotice.includes(:user).order(created_at: :desc).limit(15).map { |notice|
        {
          id: notice.id,
          user_id: notice.user_id,
          user_display_name: notice.user.display_name,
          broke_on: notice.broke_on.strftime("%b %d, %Y"),
          streak_length: notice.streak_length
        }
      }
    }
  end

  def weekly_ping
    SlackContributorsPingJob.perform_later
    audit!("slack_pings.weekly_ping_triggered")
    redirect_to admin_slack_pings_path, notice: "Weekly contributor ping queued."
  end

  def leaderboard
    SlackStreakLeaderboardJob.perform_later
    audit!("slack_pings.leaderboard_triggered")
    redirect_to admin_slack_pings_path, notice: "Streak leaderboard queued."
  end

  def streak_breaks
    StreakBreakCheckJob.perform_later(false)
    audit!("slack_pings.streak_breaks_triggered")
    redirect_to admin_slack_pings_path, notice: "Streak break check queued — new breaks post immediately."
  end

  def invites
    SlackContributorsInviteJob.perform_later
    audit!("slack_pings.invites_triggered")
    redirect_to admin_slack_pings_path, notice: "Contributor channel invite sweep queued."
  end
end
