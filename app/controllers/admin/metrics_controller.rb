class Admin::MetricsController < Admin::ApplicationController
  COIN_USD_VALUE = 1.0

  def index
    days = (params[:days].presence || 30).to_i.clamp(7, 180)
    today = Date.current
    start_date = today - (days - 1)

    login_in_range = UserLoginDay.where(login_on: start_date..today)

    counts_by_day = login_in_range.group(:login_on).distinct.count(:user_id)

    daily = (start_date..today).map do |d|
      { date: d.strftime("%Y-%m-%d"), label: d.strftime("%b %d"), count: counts_by_day[d] || 0 }
    end

    totals = daily.map { |d| d[:count] }
    total_signups = User.kept.count
    active_any = login_in_range.distinct.count(:user_id)
    active_today = UserLoginDay.where(login_on: today).distinct.count(:user_id)
    active_now = User.kept.where("last_seen_at > ?", 5.minutes.ago).count
    avg_dau = totals.size.positive? ? (totals.sum.to_f / totals.size).round(1) : 0

    hours_by_day = Devlog
      .unscope(:order)
      .joins(:project)
      .where(projects: { shadow_banned: false })
      .where(devlogs: { created_at: start_date.beginning_of_day..today.end_of_day })
      .group(Arel.sql("DATE(devlogs.created_at)"))
      .sum(:time_hours)
      .transform_keys { |k| k.is_a?(String) ? Date.parse(k) : k }

    daily_hours = (start_date..today).map do |d|
      { date: d.strftime("%Y-%m-%d"), label: d.strftime("%b %d"), hours: (hours_by_day[d] || 0).to_f.round(1) }
    end
    hours_today = (hours_by_day[today] || 0).to_f.round(1)
    hours_range_total = daily_hours.sum { |d| d[:hours] }
    avg_hours_per_day = daily_hours.size.positive? ? (hours_range_total / daily_hours.size).round(1) : 0

    builders_in_range = Devlog
      .joins(:project)
      .where(projects: { shadow_banned: false })
      .where(devlogs: { created_at: start_date.beginning_of_day..today.end_of_day })
      .distinct.count(:user_id)
    avg_hours_per_person = builders_in_range.positive? ? (hours_range_total / builders_in_range).round(1) : 0

    approved_hours_range = Devlog
      .joins(:project)
      .where(projects: { shadow_banned: false })
      .approved
      .where(devlogs: { reviewed_at: start_date.beginning_of_day..today.end_of_day })
      .sum(Arel.sql("COALESCE(devlogs.approved_hours, devlogs.time_hours)")).to_f.round(1)

    hours_goal_target = 20_000
    total_hours_logged = Devlog
      .joins(:project)
      .where(projects: { shadow_banned: false })
      .sum(:time_hours).to_f.round(1)
    hours_goal_remaining = (hours_goal_target - total_hours_logged).round(1)
    hours_goal_percent = hours_goal_target.positive? ? ((total_hours_logged / hours_goal_target) * 100).round(1) : 0

    baseline_hours = (total_hours_logged - hours_range_total).round(1)
    running_hours = baseline_hours
    goal_progression = daily_hours.map do |d|
      running_hours = (running_hours + d[:hours]).round(1)
      { date: d[:date], label: d[:label], cumulative: running_hours }
    end
    days_to_goal = hours_goal_remaining > 0 && avg_hours_per_day.positive? ? (hours_goal_remaining / avg_hours_per_day).ceil : 0

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

    approved_projects = Project.kept.approved.not_shadow_banned
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

    kept_user_ids = User.kept.select(:id)
    balance_earned = Project.kept.approved
      .where.not(id: ProjectPayout.select(:project_id))
      .where(user_id: kept_user_ids)
      .includes(:devlogs, :user)
      .sum(&:coins_earned) +
      ProjectPayout.joins(:project).merge(Project.kept).where(user_id: kept_user_ids).sum(:coins).to_f
    balance_adjustments = CoinAdjustment.where(user_id: kept_user_ids).sum(:amount).to_f
    balance_spent = Order.where(status: %i[pending approved fulfilled], user_id: kept_user_ids).sum(:coin_cost).to_f
    coins_in_accounts = {
      earned: balance_earned.round(2),
      adjustments: balance_adjustments.round(2),
      spent: balance_spent.round(2),
      balance: (balance_earned + balance_adjustments - balance_spent).round(2)
    }

    approved_referrals_count = Referral.approved.count
    referral_per_unit = Referral::PAYOUT_AMOUNT + Referral::PRIZE_POOL_CONTRIBUTION
    referral_economy = {
      count: approved_referrals_count,
      per_unit: referral_per_unit,
      total_coins: (approved_referrals_count * referral_per_unit).round(2)
    }

    reels_with_payouts = Reel.where("lifetime_payout_coins > 0")
    reel_economy = {
      count: reels_with_payouts.count,
      total_views: Reel.sum(:views_count),
      total_kudos: Reel.sum(:kudos_count),
      coins_per_view: Reel::COINS_PER_VIEW,
      coins_per_kudo: Reel::COINS_PER_KUDO,
      total_coins: Reel.sum(:lifetime_payout_coins).to_f.round(2)
    }

    user_country_counts = User.kept.where.not(country: [ nil, "" ]).group(:country).order(Arel.sql("count(*) desc")).limit(20).count
    users_with_country = User.kept.where.not(country: [ nil, "" ]).count
    users_total = User.kept.count
    user_locations = user_country_counts.map { |country, count| { country: country, count: count } }

    visit_country_counts = Ahoy::Visit.where.not(country: [ nil, "" ]).group(:country).order(Arel.sql("count(*) desc")).limit(20).count
    visit_locations = visit_country_counts.map { |country, count| { country: country, count: count } }
    visits_total = Ahoy::Visit.where.not(country: [ nil, "" ]).count

    location_distribution = {
      users: {
        by_country: user_locations,
        with_country: users_with_country,
        total: users_total,
        countries_represented: User.kept.where.not(country: [ nil, "" ]).distinct.count(:country)
      },
      visits: {
        by_country: visit_locations,
        total: visits_total,
        countries_represented: Ahoy::Visit.where.not(country: [ nil, "" ]).distinct.count(:country)
      }
    }

    review_stats = review_metrics(start_date.beginning_of_day..today.end_of_day)

    pending_queue_projects = Project.kept.where(status: :pending).not_flagged_for_review
    pending_queue_hours = Devlog.joins(:project)
      .where(project_id: pending_queue_projects.select(:id))
      .sum(:time_hours).to_f.round(1)

    fulfilled_shop_orders = Order.where(kind: "shop_item", status: :fulfilled)
    shop_coin_value_usd = (fulfilled_shop_orders.sum(:coin_cost).to_f * COIN_USD_VALUE).round(2)
    shop_item_cost_usd = Order.joins(:shop_item)
      .where(kind: "shop_item", status: :fulfilled)
      .sum(Arel.sql("COALESCE(shop_items.internal_price_usd, 0) * orders.quantity")).to_f.round(2)
    shop_economy = {
      coin_value_usd: shop_coin_value_usd,
      item_cost_usd: shop_item_cost_usd,
      margin_usd: (shop_coin_value_usd - shop_item_cost_usd).round(2),
      orders_count: fulfilled_shop_orders.count
    }

    render inertia: "Admin/Metrics/Index", props: {
      range_days: days,
      summary: {
        total_users: total_signups,
        active_in_range: active_any,
        active_today: active_today,
        active_now: active_now,
        average_dau: avg_dau,
        hours_today: hours_today,
        hours_range_total: hours_range_total.round(1),
        avg_hours_per_day: avg_hours_per_day,
        avg_hours_per_person: avg_hours_per_person,
        approved_hours_range: approved_hours_range,
        pending_queue_hours: pending_queue_hours
      },
      daily: daily,
      daily_hours: daily_hours,
      hours_goal: {
        target: hours_goal_target,
        total_logged: total_hours_logged,
        remaining: hours_goal_remaining,
        percent: hours_goal_percent,
        avg_per_day: avg_hours_per_day,
        days_to_goal: days_to_goal,
        progression: goal_progression
      },
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
        avg_coins_per_hour: avg_coins_per_hour,
        grand_total: (total_coins_all + referral_economy[:total_coins] + reel_economy[:total_coins]).round(2),
        in_accounts: coins_in_accounts
      },
      referral_economy: referral_economy,
      reel_economy: reel_economy,
      location_distribution: location_distribution,
      reviews: review_stats,
      shop_economy: shop_economy,
      budget: HcbService.summary
    }
  end

  private

  # Review throughput for completed reviews in the given window:
  #   - avg_active_seconds:    heartbeat-measured hands-on review time per review
  #   - avg_wall_seconds:      open → decision wall-clock per review
  #   - avg_turnaround_seconds: builder submit → reviewer decision (queue + review)
  def review_metrics(window)
    completed = ReviewSession.completed.where(ended_at: window)
    completed_count = completed.count
    avg_active = completed.average(:active_seconds).to_f.round

    wall_total = 0
    completed.where.not(started_at: nil).pluck(:started_at, :ended_at).each do |started_at, ended_at|
      wall_total += (ended_at - started_at).to_i
    end
    avg_wall = completed_count.positive? ? (wall_total / completed_count) : 0

    decision_actions = %w[project.approved project.returned project.rejected project.pitch_approved]
    decisions = AuditEvent
      .where(action: decision_actions, target_type: "Project", created_at: window)
      .pluck(:target_id, :created_at)

    subs_by_project = AuditEvent
      .where(action: "project.submitted_for_review", target_type: "Project", target_id: decisions.map(&:first).uniq)
      .pluck(:target_id, :created_at)
      .group_by(&:first)
      .transform_values { |rows| rows.map(&:last) }

    turnaround_total = 0
    turnaround_count = 0
    decisions.each do |project_id, decided_at|
      submitted_at = subs_by_project[project_id]&.select { |t| t <= decided_at }&.max
      next unless submitted_at

      turnaround_total += (decided_at - submitted_at).to_i
      turnaround_count += 1
    end
    avg_turnaround = turnaround_count.positive? ? (turnaround_total / turnaround_count) : 0

    {
      completed: completed_count,
      avg_active_seconds: avg_active,
      avg_wall_seconds: avg_wall,
      avg_turnaround_seconds: avg_turnaround,
      turnaround_sample: turnaround_count
    }
  end
end
