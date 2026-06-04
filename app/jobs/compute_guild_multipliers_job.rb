class ComputeGuildMultipliersJob < ApplicationJob
  queue_as :background

  MIN_MULTIPLIER = 1.0
  MAX_MULTIPLIER = 1.5
  ACTIVITY_WEIGHT = 0.2
  REFERRAL_WEIGHT = 0.02

  def perform
    return unless FeatureFlag.enabled?("guilds")

    window_start = 7.days.ago
    now = Time.current

    User.guilds.each_key do |guild|
      total_members = User.kept.in_guild(guild).count
      active_members = UserActivityDay
        .where(active_on: window_start..)
        .joins(:user)
        .merge(User.in_guild(guild))
        .distinct
        .count(:user_id)

      referrals_week = Referral.approved
        .where(approved_at: window_start..)
        .joins(:referrer)
        .merge(User.in_guild(guild))
        .count

      active_ratio = total_members.positive? ? (active_members.to_f / total_members) : 0.0
      raw = 1.0 + (active_ratio * ACTIVITY_WEIGHT) + (referrals_week * REFERRAL_WEIGHT)
      multiplier = raw.clamp(MIN_MULTIPLIER, MAX_MULTIPLIER).round(3)

      state = GuildState.find_or_initialize_by(guild: guild)
      state.update!(
        multiplier: multiplier,
        members_active_week: active_members,
        referrals_week: referrals_week,
        computed_at: now
      )
    end
  end
end
