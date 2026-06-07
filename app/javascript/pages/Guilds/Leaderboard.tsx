import { useMemo, useState } from 'react'
import { Head, Link } from '@inertiajs/react'

interface Row {
  name: string
  tagline: string
  icon: string
  member_count: number
  multiplier: number
  members_active_week: number
  referrals_week: number
  prize_pool_coins: number
  referrals_total: number
  computed_at: string | null
}

type SortKey =
  | 'multiplier'
  | 'member_count'
  | 'members_active_week'
  | 'referrals_week'
  | 'prize_pool_coins'
  | 'referrals_total'

const ACCENT: Record<string, string> = {
  rivendell: 'text-emerald-300',
  erebor: 'text-amber-300',
  edoras: 'text-yellow-200',
  valinor: 'text-violet-200',
}

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: 'prize_pool_coins', label: 'Pool (7d)' },
  { key: 'multiplier', label: 'Multiplier' },
  { key: 'member_count', label: 'Members' },
  { key: 'members_active_week', label: 'Active (7d)' },
  { key: 'referrals_week', label: 'Referrals (7d)' },
  { key: 'referrals_total', label: 'Referrals (all)' },
]

export default function GuildsLeaderboard({ mine, rows }: { mine: string | null; rows: Row[] }) {
  const [sortKey, setSortKey] = useState<SortKey>('multiplier')

  const sorted = useMemo(() => {
    return [...rows].sort((a, b) => b[sortKey] - a[sortKey])
  }, [rows, sortKey])

  return (
    <div className="min-h-screen text-stone-200">
      <Head title="Guild leaderboard" />
      <div className="max-w-5xl mx-auto px-6 py-10">
        <Link
          href="/guilds"
          className="text-xs text-stone-500 hover:text-[#ffb595] uppercase tracking-widest font-bold inline-flex items-center gap-1 mb-6"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Guilds
        </Link>

        <div className="mb-8">
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#ca5924] font-bold mb-2">Leaderboard</p>
          <h1 className="text-3xl md:text-4xl font-headline font-bold tracking-tighter text-[#e5e2e1]">
            How the houses stack up.
          </h1>
        </div>

        <div className="ghost-border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-[10px] uppercase tracking-widest text-stone-500">
                <th className="text-left px-4 py-3 font-bold">Guild</th>
                {COLUMNS.map((col) => {
                  const active = sortKey === col.key
                  return (
                    <th key={col.key} className="text-right px-4 py-3 font-bold">
                      <button
                        type="button"
                        onClick={() => setSortKey(col.key)}
                        className={`uppercase tracking-widest text-[10px] font-bold hover:text-[#ffb595] transition-colors ${
                          active ? 'text-[#ca5924]' : 'text-stone-500'
                        }`}
                      >
                        {col.label}
                        {active && <span className="material-symbols-outlined text-xs ml-1 align-middle">south</span>}
                      </button>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {sorted.map((row, idx) => {
                const accent = ACCENT[row.name] || 'text-[#ca5924]'
                const isMine = row.name === mine
                return (
                  <tr
                    key={row.name}
                    className={`border-b border-white/5 last:border-0 hover:bg-[#252423] transition-colors ${
                      isMine ? 'bg-[#ca5924]/5' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <Link href={`/guilds/${row.name}`} className="flex items-center gap-3 group">
                        <span
                          className={`font-headline font-bold text-sm w-5 shrink-0 ${idx === 0 ? 'text-[#ca5924]' : idx < 3 ? 'text-[#ffb595]' : 'text-stone-500'}`}
                        >
                          {idx + 1}
                        </span>
                        <span
                          className={`material-symbols-outlined text-2xl shrink-0 ${accent}`}
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          {row.icon}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-headline font-bold text-[#e5e2e1] capitalize group-hover:text-[#ffb595] transition-colors">
                              {row.name}
                            </span>
                            {isMine && (
                              <span className="text-[9px] uppercase tracking-widest text-[#ca5924] font-bold">You</span>
                            )}
                          </div>
                          <p className="text-stone-500 text-xs truncate">{row.tagline}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="text-right px-4 py-3 text-[#ffb595] font-headline font-bold tabular-nums">
                      {row.prize_pool_coins.toFixed(2)}c
                    </td>
                    <td className="text-right px-4 py-3 text-stone-300 tabular-nums">{row.multiplier.toFixed(2)}×</td>
                    <td className="text-right px-4 py-3 text-[#e5e2e1] tabular-nums">{row.member_count}</td>
                    <td className="text-right px-4 py-3 text-stone-300 tabular-nums">{row.members_active_week}</td>
                    <td className="text-right px-4 py-3 text-stone-300 tabular-nums">{row.referrals_week}</td>
                    <td className="text-right px-4 py-3 text-stone-300 tabular-nums">{row.referrals_total}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <p className="text-[10px] uppercase tracking-widest text-stone-700 text-center mt-8">
          Multiplier last computed{' '}
          {sorted.find((r) => r.computed_at)?.computed_at || 'never — Sunday at midnight is the first run'}
        </p>
      </div>
    </div>
  )
}
