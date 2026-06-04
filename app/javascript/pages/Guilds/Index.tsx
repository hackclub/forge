import { useState } from 'react'
import { Head, Link } from '@inertiajs/react'

interface GuildSummary {
  name: string
  tagline: string
  icon: string
  member_count: number
  multiplier: number
  prize_pool_coins: number
  computed_at: string | null
}

interface GuildDetail extends GuildSummary {
  members_active_week: number
  referrals_week: number
}

interface ActivityItem {
  id: number
  title: string
  status: string
  time_spent: string | null
  created_at: string
  user: { id: number; display_name: string; avatar: string }
  project: { id: number; name: string }
}

const ACCENT: Record<string, { text: string; bg: string; border: string }> = {
  rivendell: { text: 'text-emerald-300', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  erebor: { text: 'text-amber-300', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  edoras: { text: 'text-yellow-200', bg: 'bg-yellow-300/10', border: 'border-yellow-300/30' },
  valinor: { text: 'text-violet-200', bg: 'bg-violet-300/10', border: 'border-violet-300/30' },
}

const STATUS_LABEL: Record<string, string> = {
  draft: 'Draft',
  pending: 'Pending review',
  approved: 'Approved',
  returned: 'Returned',
}

export default function GuildsIndex({
  mine,
  referral_url,
  referral_code,
  my_guild_detail,
  recent_activity,
  guilds,
}: {
  mine: string | null
  referral_url: string
  referral_code: string | null
  my_guild_detail: GuildDetail | null
  recent_activity: ActivityItem[]
  guilds: GuildSummary[]
}) {
  const [copied, setCopied] = useState(false)
  const accent = mine ? ACCENT[mine] : null

  function copyReferral() {
    if (!referral_url) return
    navigator.clipboard.writeText(referral_url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <div className="min-h-screen bg-[#0e0e0e] text-stone-200">
      <Head title="Guilds" />
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-start justify-between gap-4 mb-10">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-[#ca5924] font-bold mb-2">Guilds</p>
            <h1 className="text-3xl md:text-4xl font-headline font-bold tracking-tighter text-[#e5e2e1]">
              Four houses, one forge.
            </h1>
          </div>
          <Link
            href="/guilds/leaderboard"
            className="shrink-0 ghost-border bg-[#1c1b1b] hover:bg-[#252423] text-stone-400 hover:text-[#ffb595] px-4 py-2 uppercase tracking-wider text-[10px] font-bold flex items-center gap-2 transition-colors corner-accents"
          >
            <span className="material-symbols-outlined text-base">emoji_events</span>
            Leaderboard
          </Link>
        </div>

        {my_guild_detail && accent && (
          <div className="space-y-6 mb-12">
            <div className={`relative bg-[#1c1b1b] border ${accent.border} corner-accents p-8 overflow-hidden`}>
              <div className={`absolute -top-24 -right-24 w-64 h-64 rounded-full blur-3xl opacity-30 ${accent.bg}`} />
              <div className="relative flex items-start gap-5">
                <span
                  className={`material-symbols-outlined text-6xl shrink-0 ${accent.text}`}
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  {my_guild_detail.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-stone-500 font-bold mb-1">Your guild</p>
                  <h2 className="text-3xl md:text-4xl font-headline font-bold tracking-tighter text-[#e5e2e1] capitalize">
                    {my_guild_detail.name}
                  </h2>
                  <p className="text-stone-500 text-sm md:text-base mt-2">{my_guild_detail.tagline}</p>
                </div>
                <Link
                  href={`/guilds/${my_guild_detail.name}`}
                  className="shrink-0 self-center text-stone-500 hover:text-[#ffb595] transition-colors"
                  title="View guild page"
                >
                  <span className="material-symbols-outlined">arrow_forward</span>
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#1c1b1b] border border-white/5 corner-accents p-5">
                <p className="text-[10px] uppercase tracking-[0.3em] text-stone-500 font-bold mb-3">
                  This week's prize pool
                </p>
                <p className="text-4xl font-headline font-bold text-[#ffb595] tabular-nums flex items-baseline gap-1.5">
                  {my_guild_detail.prize_pool_coins.toFixed(2)}
                  <span className="text-base text-stone-500">coins</span>
                </p>
                <p className="text-xs text-stone-500 mt-2 leading-relaxed">
                  1 coin per approved referral from your guild this week. Paid out Sunday — your share is proportional
                  to how many referrals you personally brought in.
                </p>
                <div className="flex gap-4 mt-4 text-xs">
                  <div>
                    <span className="text-[#ffb595] font-headline font-bold tabular-nums">
                      {my_guild_detail.multiplier.toFixed(2)}×
                    </span>{' '}
                    <span className="text-stone-600">multiplier</span>
                  </div>
                  <div>
                    <span className="text-[#e5e2e1] font-headline font-bold tabular-nums">
                      {my_guild_detail.referrals_week}
                    </span>{' '}
                    <span className="text-stone-600">referrals</span>
                  </div>
                  <div>
                    <span className="text-[#e5e2e1] font-headline font-bold tabular-nums">
                      {my_guild_detail.members_active_week}
                    </span>{' '}
                    <span className="text-stone-600">active</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#1c1b1b] border border-white/5 corner-accents p-5 flex flex-col">
                <p className="text-[10px] uppercase tracking-[0.3em] text-stone-500 font-bold mb-3">
                  Your referral link
                </p>
                <p className="text-xs text-stone-500 mb-3 leading-relaxed">
                  Anyone who joins through your link counts toward{' '}
                  <span className="capitalize text-stone-300">{my_guild_detail.name}</span>'s weekly multiplier and
                  leaderboard.
                </p>
                {referral_url ? (
                  <>
                    <div className="flex items-center gap-2 bg-[#0e0e0e] border border-white/10 px-3 py-2 mb-2 mt-auto">
                      <code className="text-xs text-[#ffb595] truncate flex-1 font-mono">{referral_url}</code>
                    </div>
                    <button
                      type="button"
                      onClick={copyReferral}
                      className="ghost-border bg-[#0e0e0e] hover:bg-[#252423] text-stone-400 hover:text-[#ffb595] px-3 py-2 uppercase tracking-wider text-[10px] font-bold flex items-center justify-center gap-2 transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">{copied ? 'check' : 'content_copy'}</span>
                      {copied ? 'Copied' : `Copy${referral_code ? ` (${referral_code})` : ''}`}
                    </button>
                  </>
                ) : (
                  <p className="text-xs text-stone-600 italic mt-auto">
                    No referral code yet — ask an admin to generate one.
                  </p>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-headline font-bold text-[#e5e2e1] tracking-tight flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#ca5924]">forum</span>
                  What <span className="capitalize">{my_guild_detail.name}</span> is building
                </h3>
              </div>
              {recent_activity.length === 0 ? (
                <p className="text-stone-600 text-sm italic">No devlogs from your guild yet. Be the first to ship.</p>
              ) : (
                <div className="ghost-border divide-y divide-white/5">
                  {recent_activity.map((item) => (
                    <Link
                      key={item.id}
                      href={`/projects/${item.project.id}`}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-[#252423] transition-colors group"
                    >
                      <img src={item.user.avatar} alt="" className="w-8 h-8 border border-white/5 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span className="font-headline font-bold text-[#e5e2e1] text-sm group-hover:text-[#ffb595] transition-colors">
                            {item.user.display_name}
                          </span>
                          <span className="text-stone-600 text-xs">on</span>
                          <span className="text-[#ffb595] text-sm font-medium truncate">{item.project.name}</span>
                        </div>
                        <p className="text-stone-400 text-sm mt-1 truncate">{item.title}</p>
                        <div className="flex items-center gap-3 mt-1.5 text-[10px] uppercase tracking-widest text-stone-600">
                          <span>{STATUS_LABEL[item.status] || item.status}</span>
                          {item.time_spent && <span>{item.time_spent}</span>}
                          <span>{item.created_at}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-[#1c1b1b] border border-white/5 corner-accents p-5">
              <h3 className="text-sm font-headline font-bold text-[#e5e2e1] tracking-tight flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-[#ca5924] text-base">info</span>
                How guild rewards work
              </h3>
              <ul className="text-xs text-stone-400 space-y-2 leading-relaxed">
                <li>
                  Every approved referral adds 1 coin to your guild's weekly prize pool. The pool is paid out every
                  Sunday — your share is proportional to how many referrals you personally brought in.
                </li>
                <li>
                  On top of that, the guild earns a small multiplier (up to 1.04×) on coin gains from projects and
                  referral payouts, based on how many referrals the guild brought in that week.
                </li>
                <li>Stacking with the streak multiplier, the combined boost is capped at 1.30×.</li>
                <li>Only an admin can move you to a different guild after you've picked.</li>
              </ul>
            </div>
          </div>
        )}

        {!my_guild_detail && (
          <div className="bg-[#1c1b1b] border border-white/5 corner-accents p-8 mb-10 text-center">
            <p className="text-stone-400 text-sm">
              You're not in a guild yet.{' '}
              <Link href="/guilds/choose" className="text-[#ffb595] underline">
                Pick one
              </Link>
              .
            </p>
          </div>
        )}

        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-stone-500 font-bold mb-3">All guilds</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {guilds.map((g) => {
              const acc = ACCENT[g.name]
              return (
                <Link
                  key={g.name}
                  href={`/guilds/${g.name}`}
                  className="bg-[#1c1b1b] border border-white/5 corner-accents p-4 hover:bg-[#252423] transition-colors"
                >
                  <span
                    className={`material-symbols-outlined text-2xl ${acc?.text || 'text-[#ca5924]'}`}
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    {g.icon}
                  </span>
                  <h4 className="text-sm font-headline font-bold tracking-tight text-[#e5e2e1] capitalize mt-2">
                    {g.name}
                  </h4>
                  <div className="flex gap-2 mt-1 text-[10px] text-stone-600">
                    <span className="text-[#ffb595] font-headline font-bold tabular-nums">
                      {g.multiplier.toFixed(2)}×
                    </span>
                    <span>·</span>
                    <span className="tabular-nums text-stone-400">{g.member_count}</span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
