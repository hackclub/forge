import { cn } from '@/components/admin/lib/cn'

export interface QueueMetrics {
  pending_total: number
  pending_design: number
  pending_build: number
  oldest_wait_seconds: number
  p50_wait_seconds: number
  p90_wait_seconds: number
  approval_rate_percent: number | null
  avg_turnaround_seconds: number
  turnaround_sample: number
  sla_hours: number
  window_days: number
}

export function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds))
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  const h = Math.floor(s / 3600)
  const d = Math.floor(s / 86400)
  if (d > 0) return `${d}d ${h % 24}h`
  if (h > 0) return `${h}h ${m % 60}m`
  return `${m}m`
}

export function QueueStatCards({ metrics }: { metrics: QueueMetrics }) {
  const slaSeconds = metrics.sla_hours * 3600
  const cards = [
    {
      label: 'Pending',
      value: String(metrics.pending_total),
      sub: `${metrics.pending_design} design · ${metrics.pending_build} build`,
      danger: false,
    },
    {
      label: 'Oldest wait',
      value: formatDuration(metrics.oldest_wait_seconds),
      sub: `P90 ${formatDuration(metrics.p90_wait_seconds)} · median ${formatDuration(metrics.p50_wait_seconds)}`,
      danger: metrics.oldest_wait_seconds > slaSeconds,
    },
    {
      label: `Approval rate · ${metrics.window_days}d`,
      value: metrics.approval_rate_percent == null ? '—' : `${metrics.approval_rate_percent}%`,
      sub: `${metrics.turnaround_sample} decided`,
      danger: false,
    },
    {
      label: 'Avg turnaround',
      value: metrics.avg_turnaround_seconds ? formatDuration(metrics.avg_turnaround_seconds) : '—',
      sub: `SLA target ${metrics.sla_hours}h`,
      danger: metrics.avg_turnaround_seconds > slaSeconds,
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((c) => (
        <div key={c.label} className="rounded-md border border-border bg-card p-3">
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground">{c.label}</p>
          <p className={cn('text-2xl font-semibold font-mono mt-1', c.danger && 'text-red-600 dark:text-red-400')}>
            {c.value}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{c.sub}</p>
        </div>
      ))}
    </div>
  )
}
