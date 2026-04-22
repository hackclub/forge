import { router } from '@inertiajs/react'

interface DailyPoint {
  date: string
  label: string
  count: number
}

interface Summary {
  total_users: number
  active_in_range: number
  active_today: number
  active_now: number
  average_dau: number
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
}

export default function AdminMetricsIndex({
  range_days,
  summary,
  daily,
  streak_buckets,
  referrals,
  payouts,
  tier_breakdown,
  coin_economy,
}: {
  range_days: number
  summary: Summary
  daily: DailyPoint[]
  streak_buckets: Record<string, number>
  referrals: Referrals
  payouts: Payouts
  tier_breakdown: TierRow[]
  coin_economy: CoinEconomy
}) {
  const max = Math.max(1, ...daily.map((d) => d.count))
  const ranges = [7, 30, 60, 90, 180]

  const bucketMax = Math.max(1, ...Object.values(streak_buckets))

  return (
    <div className="p-5 md:p-12 max-w-[1400px] mx-auto">
      <h1 className="text-4xl font-headline font-bold text-[#e5e2e1] tracking-tight mb-2">Metrics</h1>
      <p className="text-stone-500 text-sm mb-8">Daily active users and engagement signals.</p>

      <div className="flex gap-2 mb-8">
        {ranges.map((r) => (
          <button
            key={r}
            onClick={() => router.get('/admin/metrics', { days: r }, { preserveState: true })}
            className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] transition-colors cursor-pointer ${range_days === r ? 'signature-smolder text-[#4c1a00]' : 'ghost-border bg-[#1c1b1b] text-stone-400 hover:bg-[#2a2a2a]'}`}
          >
            {r}d
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-10">
        <Stat label="Active now" value={summary.active_now} hint="seen in last 5 min" accent />
        <Stat label="Active today" value={summary.active_today} hint="unique today" />
        <Stat label={`Avg DAU (${range_days}d)`} value={summary.average_dau} hint="mean active per day" />
        <Stat label={`Active in ${range_days}d`} value={summary.active_in_range} hint="unique users in range" />
        <Stat label="Total users" value={summary.total_users} hint="all signups" />
      </div>

      <div className="bg-[#1c1b1b] ghost-border p-6 mb-10">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-stone-500 font-headline mb-4">
          Daily Active Users — last {range_days} days
        </h2>
        <div className="flex items-end gap-1 h-48">
          {daily.map((d) => {
            const pct = (d.count / max) * 100
            return (
              <div
                key={d.date}
                className="flex-1 h-full flex flex-col justify-end items-center group relative min-w-0"
                title={`${d.label}: ${d.count}`}
              >
                <span className="invisible group-hover:visible absolute -top-6 text-[10px] font-mono text-[#ffb595] whitespace-nowrap bg-[#0e0e0e] ghost-border px-1 z-10">
                  {d.count}
                </span>
                <div
                  className="w-full bg-[#ee671c]/80 group-hover:bg-[#ee671c] transition-colors min-h-[1px]"
                  style={{ height: `${pct}%` }}
                />
              </div>
            )
          })}
        </div>
        <div className="flex justify-between text-[10px] text-stone-600 mt-2 font-mono">
          <span>{daily[0]?.label}</span>
          <span>{daily[daily.length - 1]?.label}</span>
        </div>
      </div>

      <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-stone-500 font-headline mb-4">
        Referrals — last {range_days} days
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-10">
        <Stat label="Total" value={referrals.total} />
        <Stat label="Approved" value={referrals.approved} accent />
        <Stat label="Eligible" value={referrals.eligible} />
        <Stat label="Pending" value={referrals.pending} />
        <Stat label="Conversion" value={`${referrals.conversion_percent}%`} hint="approved / total" />
      </div>

      <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-stone-500 font-headline mb-4">
        Coin payouts — last {range_days} days
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
        <Stat label="Net payouts" value={payouts.total} hint="positive − negative" />
        <Stat label="Awards only" value={payouts.positive_only} accent />
        <Stat label="Avg per day (net)" value={payouts.avg_per_day} />
        <Stat label="Avg per day (awards)" value={payouts.avg_positive_per_day} />
      </div>

      <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-stone-500 font-headline mb-4">
        Coin economy by tier
      </h2>
      <div className="bg-[#1c1b1b] ghost-border overflow-x-auto mb-10">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-[#0e0e0e]">
            <tr className="text-left text-stone-500">
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.2em]">Tier</th>
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.2em]">Base rate</th>
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.2em]">Projects</th>
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.2em]">Total hours</th>
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.2em]">Coins earned</th>
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.2em]">Effective c/hr</th>
            </tr>
          </thead>
          <tbody>
            {tier_breakdown.map((t) => (
              <tr key={t.tier} className="border-t border-white/5">
                <td className="px-4 py-3 text-[#e5e2e1] font-headline font-bold">{t.tier}</td>
                <td className="px-4 py-3 text-stone-400 font-mono">{t.base_rate}</td>
                <td className="px-4 py-3 text-stone-300">{t.projects}</td>
                <td className="px-4 py-3 text-stone-300">{t.total_hours}</td>
                <td className="px-4 py-3 text-[#ffb595] font-bold">{t.total_coins}</td>
                <td className="px-4 py-3 text-stone-300 font-mono">{t.effective_rate}</td>
              </tr>
            ))}
            <tr className="border-t border-white/10 bg-[#0e0e0e]/50">
              <td className="px-4 py-3 text-[#e5e2e1] font-headline font-bold uppercase text-xs tracking-[0.15em]">All tiers</td>
              <td className="px-4 py-3 text-stone-600">—</td>
              <td className="px-4 py-3 text-stone-500">{tier_breakdown.reduce((n, t) => n + t.projects, 0)}</td>
              <td className="px-4 py-3 text-stone-500">{coin_economy.total_hours}</td>
              <td className="px-4 py-3 text-[#ffb595] font-bold">{coin_economy.total_coins}</td>
              <td className="px-4 py-3 text-[#ffb595] font-bold font-mono">{coin_economy.avg_coins_per_hour}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="bg-[#1c1b1b] ghost-border p-6">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-stone-500 font-headline mb-4">
          Active streak distribution
        </h2>
        <p className="text-stone-600 text-xs mb-4">Users active in the last 2 days, bucketed by current streak length.</p>
        <div className="space-y-2">
          {Object.entries(streak_buckets).map(([bucket, count]) => {
            const pct = (count / bucketMax) * 100
            return (
              <div key={bucket} className="flex items-center gap-3">
                <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-500 w-16 shrink-0">
                  {bucket}d
                </span>
                <div className="flex-1 bg-[#0e0e0e] h-4 overflow-hidden">
                  <div className="h-full signature-smolder" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-[#e5e2e1] text-sm font-headline font-bold w-10 text-right">{count}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value, accent, hint }: { label: string; value: string | number; accent?: boolean; hint?: string }) {
  return (
    <div className="bg-[#1c1b1b] ghost-border p-4">
      <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-500 mb-1">{label}</p>
      <p className={`text-2xl font-headline font-bold tracking-tight ${accent ? 'text-[#ffb595]' : 'text-[#e5e2e1]'}`}>{value}</p>
      {hint && <p className="text-stone-600 text-[10px] mt-1">{hint}</p>}
    </div>
  )
}
