import { router } from '@inertiajs/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/admin/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/admin/ui/table'
import { cn } from '@/components/admin/lib/cn'

interface DailyPoint {
  date: string
  label: string
  count: number
}

interface DailyHoursPoint {
  date: string
  label: string
  hours: number
}

interface Summary {
  total_users: number
  active_in_range: number
  active_today: number
  active_now: number
  average_dau: number
  hours_today: number
  hours_range_total: number
  avg_hours_per_day: number
}

interface Referrals {
  total: number
  approved: number
  eligible: number
  pending: number
  conversion_percent: number
}

interface Payouts {
  total: number
  positive_only: number
  avg_per_day: number
  avg_positive_per_day: number
}

interface TierRow {
  tier: string
  base_rate: number
  projects: number
  total_hours: number
  total_coins: number
  effective_rate: number
}

interface CoinEconomy {
  total_hours: number
  total_coins: number
  avg_coins_per_hour: number
  grand_total: number
}

interface ReferralEconomy {
  count: number
  per_unit: number
  total_coins: number
}

interface ReelEconomy {
  count: number
  total_views: number
  total_kudos: number
  coins_per_view: number
  coins_per_kudo: number
  total_coins: number
}

interface ReviewStats {
  completed: number
  avg_active_seconds: number
  avg_wall_seconds: number
  avg_turnaround_seconds: number
  turnaround_sample: number
}

interface CountryRow {
  country: string
  count: number
}

interface LocationDistribution {
  users: {
    by_country: CountryRow[]
    with_country: number
    total: number
    countries_represented: number
  }
  visits: {
    by_country: CountryRow[]
    total: number
    countries_represented: number
  }
}

function CountryBars({ rows, total }: { rows: CountryRow[]; total: number }) {
  if (rows.length === 0) {
    return <p className="text-xs text-muted-foreground">No data yet.</p>
  }
  const max = Math.max(1, ...rows.map((r) => r.count))
  return (
    <div className="space-y-1.5">
      {rows.map((row) => {
        const pct = (row.count / max) * 100
        const share = total > 0 ? ((row.count / total) * 100).toFixed(1) : '0.0'
        return (
          <div key={row.country} className="flex items-center gap-3">
            <span className="text-xs font-mono w-20 shrink-0 truncate" title={row.country}>
              {row.country}
            </span>
            <div className="flex-1 bg-muted h-4 overflow-hidden rounded">
              <div className="h-full bg-primary rounded" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs font-medium w-12 text-right tabular-nums">{row.count}</span>
            <span className="text-[10px] text-muted-foreground w-12 text-right tabular-nums">{share}%</span>
          </div>
        )
      })}
    </div>
  )
}

function formatDuration(s: number): string {
  if (!s || s <= 0) return '—'
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s % 60}s`
  return `${s}s`
}

function Stat({ label, value, hint, accent }: { label: string; value: string | number; hint?: string; accent?: boolean }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
        <p className={cn('text-2xl font-semibold tracking-tight', accent && 'text-primary')}>{value}</p>
        {hint && <p className="text-[11px] text-muted-foreground mt-1">{hint}</p>}
      </CardContent>
    </Card>
  )
}

export default function AdminMetricsIndex({
  range_days,
  summary,
  daily,
  daily_hours,
  streak_buckets,
  referrals,
  payouts,
  tier_breakdown,
  coin_economy,
  referral_economy,
  reel_economy,
  location_distribution,
  reviews,
}: {
  range_days: number
  summary: Summary
  daily: DailyPoint[]
  daily_hours: DailyHoursPoint[]
  streak_buckets: Record<string, number>
  referrals: Referrals
  payouts: Payouts
  tier_breakdown: TierRow[]
  coin_economy: CoinEconomy
  referral_economy: ReferralEconomy
  reel_economy: ReelEconomy
  location_distribution: LocationDistribution
  reviews: ReviewStats
}) {
  const max = Math.max(1, ...daily.map((d) => d.count))
  const maxHours = Math.max(1, ...daily_hours.map((d) => d.hours))
  const ranges = [7, 30, 60, 90, 180]
  const bucketMax = Math.max(1, ...Object.values(streak_buckets))

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Metrics</h1>
        <p className="text-sm text-muted-foreground mt-1">Daily active users and engagement signals.</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {ranges.map((r) => (
          <button
            key={r}
            onClick={() => router.get('/admin/metrics', { days: r }, { preserveState: true })}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded-md border transition-colors cursor-pointer',
              range_days === r
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground',
            )}
          >
            {r}d
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <Stat label="Active now" value={summary.active_now} hint="seen in last 5 min" accent />
        <Stat label="Active today" value={summary.active_today} hint="unique today" />
        <Stat label={`Avg DAU (${range_days}d)`} value={summary.average_dau} hint="mean active per day" />
        <Stat label={`Active in ${range_days}d`} value={summary.active_in_range} hint="unique users in range" />
        <Stat label="Total users" value={summary.total_users} hint="all signups" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Stat label="Hours logged today" value={`${summary.hours_today}h`} hint="builder devlog time today" accent />
        <Stat label={`Hours in ${range_days}d`} value={`${summary.hours_range_total}h`} hint="total devlog time in range" />
        <Stat label="Avg/day" value={`${summary.avg_hours_per_day}h`} hint={`mean across ${range_days} days`} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daily hours logged — last {range_days} days</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-1 h-48">
            {daily_hours.map((d) => {
              const pct = (d.hours / maxHours) * 100
              return (
                <div
                  key={d.date}
                  className="flex-1 h-full flex flex-col justify-end items-center group relative min-w-0"
                  title={`${d.label}: ${d.hours}h`}
                >
                  <span className="invisible group-hover:visible absolute -top-6 text-[10px] font-mono bg-background border border-border rounded px-1 z-10 whitespace-nowrap">
                    {d.hours}h
                  </span>
                  <div
                    className="w-full rounded-t-sm bg-emerald-500/70 group-hover:bg-emerald-500 transition-colors min-h-[1px]"
                    style={{ height: `${pct}%` }}
                  />
                </div>
              )
            })}
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground mt-2 font-mono">
            <span>{daily_hours[0]?.label}</span>
            <span>{daily_hours[daily_hours.length - 1]?.label}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daily Active Users — last {range_days} days</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-1 h-48">
            {daily.map((d) => {
              const pct = (d.count / max) * 100
              return (
                <div
                  key={d.date}
                  className="flex-1 h-full flex flex-col justify-end items-center group relative min-w-0"
                  title={`${d.label}: ${d.count}`}
                >
                  <span className="invisible group-hover:visible absolute -top-6 text-[10px] font-mono bg-background border border-border rounded px-1 z-10 whitespace-nowrap">
                    {d.count}
                  </span>
                  <div
                    className="w-full rounded-t-sm bg-primary/80 group-hover:bg-primary transition-colors min-h-[1px]"
                    style={{ height: `${pct}%` }}
                  />
                </div>
              )
            })}
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground mt-2 font-mono">
            <span>{daily[0]?.label}</span>
            <span>{daily[daily.length - 1]?.label}</span>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">Referrals — last {range_days} days</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Stat label="Total" value={referrals.total} />
          <Stat label="Approved" value={referrals.approved} accent />
          <Stat label="Eligible" value={referrals.eligible} />
          <Stat label="Pending" value={referrals.pending} />
          <Stat label="Conversion" value={`${referrals.conversion_percent}%`} hint="approved / total" />
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">Coin payouts — last {range_days} days</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="Net payouts" value={payouts.total} hint="positive − negative" />
          <Stat label="Awards only" value={payouts.positive_only} accent />
          <Stat label="Avg per day (net)" value={payouts.avg_per_day} />
          <Stat label="Avg per day (awards)" value={payouts.avg_positive_per_day} />
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">Reviews — last {range_days} days</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="Reviews completed" value={reviews.completed} hint="decisions made in range" accent />
          <Stat label="Avg review time" value={formatDuration(reviews.avg_active_seconds)} hint="active (heartbeat) time per review" />
          <Stat label="Avg open → decision" value={formatDuration(reviews.avg_wall_seconds)} hint="reviewer opened until decided" />
          <Stat
            label="Avg submit → decision"
            value={formatDuration(reviews.avg_turnaround_seconds)}
            hint={`builder submit until decided · n=${reviews.turnaround_sample}`}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coin economy by tier</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tier</TableHead>
                <TableHead>Base rate</TableHead>
                <TableHead>Projects</TableHead>
                <TableHead>Total hours</TableHead>
                <TableHead>Coins earned</TableHead>
                <TableHead>Effective c/hr</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tier_breakdown.map((t) => (
                <TableRow key={t.tier}>
                  <TableCell className="font-medium">{t.tier}</TableCell>
                  <TableCell className="font-mono">{t.base_rate}</TableCell>
                  <TableCell>{t.projects}</TableCell>
                  <TableCell>{t.total_hours}</TableCell>
                  <TableCell className="font-semibold">{t.total_coins}</TableCell>
                  <TableCell className="font-mono">{t.effective_rate}</TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell className="font-medium">referrals</TableCell>
                <TableCell className="font-mono">{referral_economy.per_unit}</TableCell>
                <TableCell>{referral_economy.count}</TableCell>
                <TableCell className="text-muted-foreground">—</TableCell>
                <TableCell className="font-semibold">{referral_economy.total_coins}</TableCell>
                <TableCell className="text-muted-foreground">—</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">reels</TableCell>
                <TableCell
                  className="font-mono text-[11px]"
                  title={`${reel_economy.coins_per_view}/view, ${reel_economy.coins_per_kudo}/kudo`}
                >
                  {reel_economy.coins_per_view}/v + {reel_economy.coins_per_kudo}/k
                </TableCell>
                <TableCell>{reel_economy.count}</TableCell>
                <TableCell className="text-[11px]">
                  {reel_economy.total_views}v / {reel_economy.total_kudos}k
                </TableCell>
                <TableCell className="font-semibold">{reel_economy.total_coins}</TableCell>
                <TableCell className="text-muted-foreground">—</TableCell>
              </TableRow>
              <TableRow className="bg-muted/40">
                <TableCell className="font-medium uppercase text-xs tracking-wide">Devlogs only</TableCell>
                <TableCell className="text-muted-foreground">—</TableCell>
                <TableCell>{tier_breakdown.reduce((n, t) => n + t.projects, 0)}</TableCell>
                <TableCell>{coin_economy.total_hours}</TableCell>
                <TableCell className="font-semibold">{coin_economy.total_coins}</TableCell>
                <TableCell className="font-mono font-semibold">{coin_economy.avg_coins_per_hour}</TableCell>
              </TableRow>
              <TableRow className="bg-muted/40">
                <TableCell className="font-medium uppercase text-xs tracking-wide">Grand total</TableCell>
                <TableCell className="text-muted-foreground">—</TableCell>
                <TableCell className="text-muted-foreground">—</TableCell>
                <TableCell className="text-muted-foreground">—</TableCell>
                <TableCell className="font-semibold">{coin_economy.grand_total}</TableCell>
                <TableCell className="text-muted-foreground">—</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Location distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-baseline justify-between mb-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Users by country
                </h3>
                <span className="text-[11px] text-muted-foreground">
                  {location_distribution.users.with_country}/{location_distribution.users.total} ·{' '}
                  {location_distribution.users.countries_represented} countries
                </span>
              </div>
              <CountryBars rows={location_distribution.users.by_country} total={location_distribution.users.with_country} />
            </div>
            <div>
              <div className="flex items-baseline justify-between mb-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Visits by country (IP geocoded)
                </h3>
                <span className="text-[11px] text-muted-foreground">
                  {location_distribution.visits.total} visits ·{' '}
                  {location_distribution.visits.countries_represented} countries
                </span>
              </div>
              <CountryBars rows={location_distribution.visits.by_country} total={location_distribution.visits.total} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active streak distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-3">
            Users active in the last 2 days, bucketed by current streak length.
          </p>
          <div className="space-y-2">
            {Object.entries(streak_buckets).map(([bucket, count]) => {
              const pct = (count / bucketMax) * 100
              return (
                <div key={bucket} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground uppercase tracking-wide w-16 shrink-0">{bucket}d</span>
                  <div className="flex-1 bg-muted h-4 overflow-hidden rounded">
                    <div className="h-full bg-primary rounded" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-sm font-medium w-10 text-right">{count}</span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
