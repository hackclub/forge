class ComputeGuildMultipliersJob < ApplicationJob
  queue_as :background

  MIN_MULTIPLIER = 1.0
  MAX_MULTIPLIER = 1.04
  REFERRAL_WEIGHT = 0.0045
  WINDOW = 7.days

  # guild: nil      -> recompute every guild (the weekly cron run)
  # guild: "erebor" -> recompute just one guild (live, e.g. after a new referral)
  # distribute:     -> only the weekly settlement run mints prize-pool coins.
  #                    Live recomputes pass distribute: false so repeated
  #                    recomputes never double-pay the pool.
  def perform(guild: nil, distribute: true)
    return unless FeatureFlag.enabled?("guilds")

    now = Time.current
    guilds = guild ? [ guild.to_s ] : User.guilds.keys

    guilds.each do |g|
      referrer_counts = recompute_guild!(g, now: now)
      distribute_prize_pool!(g, referrer_counts) if distribute
    end
  end

  # Updates the stored stats + multiplier for one guild. Idempotent: safe to
  # run as often as we like. Returns the per-referrer counts for this week.
  def recompute_guild!(guild, now: Time.current)
    window_start = now - WINDOW

    active_members = UserActivityDay
      .where(active_on: window_start..)
      .joins(:user)
      .merge(User.in_guild(guild))
      .distinct
      .count(:user_id)

    # Every referral the guild brought in this week counts, the moment the
    # referred user signs up via the link (by created_at), regardless of
    # whether an admin has approved the payout yet.
    referrer_counts = Referral
      .where(created_at: window_start..)
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

    referrer_counts
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
