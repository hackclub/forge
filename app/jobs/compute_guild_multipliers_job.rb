class ComputeGuildMultipliersJob < ApplicationJob
  queue_as :background

  MIN_MULTIPLIER = 1.0
  MAX_MULTIPLIER = 1.04
  REFERRAL_WEIGHT = 0.002

  def perform
    return unless FeatureFlag.enabled?("guilds")

    window_start = 7.days.ago
    now = Time.current

    User.guilds.each_key do |guild|
      active_members = UserActivityDay
        .where(active_on: window_start..)
        .joins(:user)
        .merge(User.in_guild(guild))
        .distinct
        .count(:user_id)

      referrer_counts = Referral.approved
        .where(approved_at: window_start..)
        .joins(:referrer)
        .merge(User.in_guild(guild))
        .group(:referrer_id)
        .count
      referrals_week = referrer_counts.values.sum

      raw = 1.0 + (referrals_week * REFERRAL_WEIGHT)
      multiplier = raw.clamp(MIN_MULTIPLIER, MAX_MULTIPLIER).round(3)

      state = GuildState.find_or_initialize_by(guild: guild)
      state.update!(
        multiplier: multiplier,
        members_active_week: active_members,
        referrals_week: referrals_week,
        computed_at: now
      )

      distribute_prize_pool!(guild, referrer_counts)
    end
  end

  private

  def distribute_prize_pool!(guild, referrer_counts)
    return if referrer_counts.empty?

    total = referrer_counts.values.sum
    pool = total * GuildState::POOL_PER_REFERRAL

    referrer_counts.each do |referrer_id, refs|
      share = (pool * refs.to_f / total).round(2)
      next if share <= 0

      referrer = User.find_by(id: referrer_id)
      next unless referrer

      referrer.coin_adjustments.create!(
        actor: nil,
        amount: share,
        reason: "#{guild.titleize} guild prize pool (#{refs}/#{total} referrals)"
      )
    end
  end
end
