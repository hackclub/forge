class Admin::MetricsController < Admin::ApplicationController
  def index
    days = (params[:days].presence || 30).to_i.clamp(7, 180)
    today = Date.current
    start_date = today - (days - 1)

    counts_by_day = UserActivityDay
      .where(active_on: start_date..today)
      .group(:active_on)
      .count

    daily = (start_date..today).map do |d|
      { date: d.strftime("%Y-%m-%d"), label: d.strftime("%b %d"), count: counts_by_day[d] || 0 }
    end

    totals = daily.map { |d| d[:count] }
    total_signups = User.kept.count
    active_any = UserActivityDay.where(active_on: start_date..today).distinct.count(:user_id)
    active_today = UserActivityDay.where(active_on: today).distinct.count(:user_id)
    active_now = User.kept.where("last_seen_at > ?", 5.minutes.ago).count
    avg_dau = totals.size.positive? ? (totals.sum.to_f / totals.size).round(1) : 0

    streaks = UserActivityDay.joins(:user).where(active_on: (today - 1)..today).distinct.pluck(:user_id).map do |uid|
      User.find(uid).current_streak
    end

    streak_buckets = {
      "1-2" => streaks.count { |s| s.between?(1, 2) },
      "3-6" => streaks.count { |s| s.between?(3, 6) },
      "7-13" => streaks.count { |s| s.between?(7, 13) },
      "14-29" => streaks.count { |s| s.between?(14, 29) },
      "30-59" => streaks.count { |s| s.between?(30, 59) },
      "60-99" => streaks.count { |s| s.between?(60, 99) },
      "100+" => streaks.count { |s| s >= 100 }
    }

    referrals_scope = Referral.where(created_at: start_date.beginning_of_day..today.end_of_day)
    referrals_total = referrals_scope.count
    referrals_approved = referrals_scope.where(status: Referral.statuses[:approved]).count
    referrals_eligible = referrals_scope.where(status: Referral.statuses[:eligible]).count
    referrals_pending = referrals_scope.where(status: Referral.statuses[:pending]).count
    referral_conversion = referrals_total.positive? ? ((referrals_approved.to_f / referrals_total) * 100).round(1) : 0

    payouts_total = CoinAdjustment.where(created_at: start_date.beginning_of_day..today.end_of_day).sum(:amount).to_f
    payouts_positive = CoinAdjustment.where(created_at: start_date.beginning_of_day..today.end_of_day).where("amount > 0").sum(:amount).to_f
    avg_payout_per_day = (payouts_total / days).round(2)
    avg_positive_per_day = (payouts_positive / days).round(2)

    approved_projects = Project.kept.approved
    tier_breakdown = Project::TIERS.map do |tier|
      scoped = approved_projects.where(tier: tier)
      projects_count = scoped.count
      hours = scoped.includes(:devlogs).sum(&:total_hours)
      coins = scoped.includes(:devlogs, :user).sum(&:coins_earned)
      {
        tier: tier,
        base_rate: Project::TIER_COIN_RATES[tier] || 0,
        projects: projects_count,
        total_hours: hours.round(1),
        total_coins: coins.round(2),
        effective_rate: hours.positive? ? (coins / hours).round(2) : 0
      }
    end

    total_hours_all = tier_breakdown.sum { |t| t[:total_hours] }
    total_coins_all = tier_breakdown.sum { |t| t[:total_coins] }
    avg_coins_per_hour = total_hours_all.positive? ? (total_coins_all / total_hours_all).round(2) : 0

    approved_referrals_count = Referral.approved.count
    referral_per_unit = Referral::PAYOUT_AMOUNT + Referral::PRIZE_POOL_CONTRIBUTION
    referral_economy = {
      count: approved_referrals_count,
      per_unit: referral_per_unit,
      total_coins: (approved_referrals_count * referral_per_unit).round(2)
    }

    render inertia: "Admin/Metrics/Index", props: {
      range_days: days,
      summary: {
        total_users: total_signups,
        active_in_range: active_any,
        active_today: active_today,
        active_now: active_now,
        average_dau: avg_dau
      },
      daily: daily,
      streak_buckets: streak_buckets,
      referrals: {
        total: referrals_total,
        approved: referrals_approved,
        eligible: referrals_eligible,
        pending: referrals_pending,
        conversion_percent: referral_conversion
      },
      payouts: {
        total: payouts_total.round(2),
        positive_only: payouts_positive.round(2),
        avg_per_day: avg_payout_per_day,
        avg_positive_per_day: avg_positive_per_day
      },
      tier_breakdown: tier_breakdown,
      coin_economy: {
        total_hours: total_hours_all.round(1),
        total_coins: total_coins_all.round(2),
        avg_coins_per_hour: avg_coins_per_hour
      },
      referral_economy: referral_economy
    }
  end
end
