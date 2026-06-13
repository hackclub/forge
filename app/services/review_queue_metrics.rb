class ReviewQueueMetrics
  SLA_HOURS = 48
  WINDOW_DAYS = 7

  def initialize(pending_scope, window: WINDOW_DAYS.days.ago..Time.current)
    @pending_scope = pending_scope
    @window = window
  end

  def as_json
    avg, sample = turnaround
    {
      pending_total: pending_total,
      pending_design: pending_total - pending_build,
      pending_build: pending_build,
      oldest_wait_seconds: waits.max&.round || 0,
      p50_wait_seconds: percentile(waits, 50),
      p90_wait_seconds: percentile(waits, 90),
      approval_rate_percent: approval_rate,
      avg_turnaround_seconds: avg,
      turnaround_sample: sample,
      sla_hours: SLA_HOURS,
      window_days: WINDOW_DAYS
    }
  end

  private

  def counts_by_build
    @counts_by_build ||= @pending_scope.group(:build_review).count
  end

  def pending_build
    counts_by_build[true].to_i
  end

  def pending_total
    counts_by_build.values.sum
  end

  def waits
    @waits ||= @pending_scope
      .pluck(Arel.sql("EXTRACT(EPOCH FROM (now() - COALESCE(submitted_at, created_at)))"))
      .map(&:to_f)
  end

  def percentile(values, pct)
    return 0 if values.empty?

    sorted = values.sort
    rank = (pct / 100.0) * (sorted.length - 1)
    lower = sorted[rank.floor]
    upper = sorted[rank.ceil]
    (lower + (upper - lower) * (rank - rank.floor)).round
  end

  def decision_counts
    @decision_counts ||= AuditEvent
      .where(action: %w[project.approved project.returned project.rejected], target_type: "Project", created_at: @window)
      .group(:action).count
  end

  def approval_rate
    total = decision_counts.values.sum
    return nil if total.zero?

    (decision_counts["project.approved"].to_i.to_f / total * 100).round
  end

  def turnaround
    decisions = AuditEvent
      .where(action: %w[project.approved project.returned project.rejected project.pitch_approved],
             target_type: "Project", created_at: @window)
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

    [ count.positive? ? (total / count) : 0, count ]
  end
end
