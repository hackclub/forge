class HackatimeBanCheckJob < ApplicationJob
  queue_as :background

  def perform
    return unless HackatimeService.enabled?

    User.kept.where(is_banned: false).find_each do |user|
      info = HackatimeService.get_trust_info(slack_id: user.slack_id, email: user.email)
      next if info.nil?

      banned = info["banned"] == true

      if banned && user.hackatime_banned_at.nil?
        user.update_columns(hackatime_banned_at: Time.current)
      elsif !banned && user.hackatime_banned_at.present?
        user.update_columns(hackatime_banned_at: nil)
      end
    rescue StandardError => e
      Rails.logger.error("HackatimeBanCheckJob failed for user #{user.id}: #{e.class}: #{e.message}")
    end
  end
end
