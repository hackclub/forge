class ContributorStats
  SLA_TARGET_HOURS = 48

  def self.weekly_summary
    new.weekly_summary
  end

  def weekly_summary
    {
      hours_shipped_this_week: hours_shipped_this_week,
      avg_hours_per_day_this_week: avg_hours_per_day_this_week,
      pending_queue_hours: pending_queue_hours,
      avg_turnaround_seconds: avg_turnaround_seconds,
      total_hours_logged: total_hours_logged,
      avg_daily_active_users: avg_daily_active_users,
      effective_coins_per_hour: effective_coins_per_hour
    }
  end

  def self.slack_message(stats = weekly_summary)
    turnaround = stats[:avg_turnaround_seconds]
    lines = [
      ":bar_chart: *Forge key stats*",
      "• Hours shipped this week: *#{stats[:hours_shipped_this_week]}h*",
      "• Average hours/day this week: *#{stats[:avg_hours_per_day_this_week]}h*",
      "• Hours in pending queue: *#{stats[:pending_queue_hours]}h*",
      "• Avg turnaround: *#{format_duration(turnaround)}* (SLA target #{SLA_TARGET_HOURS}h)",
      "• Total hours logged so far: *#{stats[:total_hours_logged]}h*",
      "• Active users (avg/day this week): *#{stats[:avg_daily_active_users]}*",
      "• Coin rate: *#{stats[:effective_coins_per_hour]} c/h* effective"
    ]
    lines.join("\n")
  end

  def self.format_duration(seconds)
    return "n/a" unless seconds.to_i.positive?

    days = seconds / 86_400
    hours = (seconds % 86_400) / 3600
    days.positive? ? "#{days}d #{hours}h" : "#{hours}h #{(seconds % 3600) / 60}m"
  end

  private

  def window
    @window ||= 7.days.ago..Time.current
  end

  def hours_shipped_this_week
    Project.kept.approved.not_shadow_banned
      .where(reviewed_at: window)
      .includes(:devlogs)
      .sum(&:total_hours).round(1)
  end

  def avg_hours_per_day_this_week
    logged = Devlog
      .unscope(:order)
      .joins(:project)
      .where(projects: { shadow_banned: false })
      .where(devlogs: { created_at: window })
      .sum(:time_hours).to_f
    (logged / 7).round(1)
  end

  def pending_queue_hours
    Project.kept.where(status: :pending).includes(:devlogs).sum(&:total_hours).round(1)
  end

  def avg_turnaround_seconds
    decision_actions = %w[project.approved project.returned project.rejected project.pitch_approved]
    decisions = AuditEvent
      .where(action: decision_actions, target_type: "Project", created_at: window)
      .pluck(:target_id, :created_at)

    subs_by_project = AuditEvent
      .where(action: "project.submitted_for_review", target_type: "Project", target_id: decisions.map(&:first).uniq)
      .pluck(:target_id, :created_at)
      .group_by(&:first)
      .transform_values { |rows| rows.map(&:last) }

    total = 0
    count = 0
    decisions.each do |project_id, decided_at|
      submitted_at = subs_by_project[project_id]&.select { |t| t <= decided_at }&.max
      next unless submitted_at

      total += (decided_at - submitted_at).to_i
      count += 1
    end
    count.positive? ? total / count : 0
  end

  def total_hours_logged
    Devlog
      .unscope(:order)
      .joins(:project)
      .where(projects: { shadow_banned: false })
      .sum(:time_hours).to_f.round(1)
  end

  def avg_daily_active_users
    start_date = Date.current - 6
    counts = UserLoginDay.where(login_on: start_date..Date.current).group(:login_on).distinct.count(:user_id)
    (counts.values.sum.to_f / 7).round(1)
  end

  def effective_coins_per_hour
    approved = Project.kept.approved.not_shadow_banned.includes(:devlogs, :user)
    hours = approved.sum(&:total_hours)
    return 0 unless hours.positive?

    (approved.sum(&:coins_earned) / hours).round(2)
  end
end
