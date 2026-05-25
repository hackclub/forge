class Admin::HackatimeBansController < Admin::ApplicationController
  before_action :require_hackatime_permission!

  def index
    users = User.kept.where.not(hackatime_banned_at: nil).order(hackatime_banned_at: :desc)

    render inertia: "Admin/HackatimeBans/Index", props: {
      users: users.map { |u| serialize_user(u) },
      enabled: HackatimeService.enabled?,
      total_flagged: users.size,
      pending_ban_count: users.where(is_banned: false).count
    }
  end

  def refresh
    HackatimeBanCheckJob.perform_later
    audit!("hackatime_bans.refresh_triggered", target: nil)
    redirect_to admin_hackatime_bans_path, notice: "Hackatime ban check queued. Refresh in a minute to see updated results."
  end

  def ban_all
    flagged = User.kept.where.not(hackatime_banned_at: nil).where(is_banned: false)
    count = 0
    flagged.find_each do |user|
      user.update!(is_banned: true, ban_reason: "Banned on Hackatime (synced #{Time.current.strftime('%b %d, %Y')})")
      audit!("user.banned", target: user, metadata: { reason: "hackatime_ban_sync", hackatime_banned_at: user.hackatime_banned_at })
      count += 1
    end
    redirect_to admin_hackatime_bans_path, notice: "Banned #{count} user#{'s' if count != 1} from Forge."
  end

  private

  def require_hackatime_permission!
    require_permission!("hackatime")
  end

  def serialize_user(user)
    {
      id: user.id,
      display_name: user.display_name,
      email: user.email,
      avatar: user.avatar,
      slack_id: user.slack_id,
      is_banned: user.is_banned,
      hackatime_banned_at: user.hackatime_banned_at&.strftime("%b %d, %Y %H:%M")
    }
  end
end
