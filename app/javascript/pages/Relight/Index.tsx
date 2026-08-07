import { Head, Link, usePage } from '@inertiajs/react'
import { useEffect, useMemo, useState } from 'react'
import type { SharedProps } from '@/types'

interface Milestone {
  name: string
  reached: boolean
}

interface EmberEntry {
  id: number
  created_at: string
  user: { id: number; display_name: string; avatar: string | null }
  project: { id: number; name: string }
}

interface GuildRow {
  name: string
  tagline: string
  icon: string
  hours: number
  share: number
}

interface RelightStats {
  percent: number
  starts_at: string
  ends_at: string
  days_remaining: number
  milestones: Milestone[]
  ember_feed: EmberEntry[]
  guild_race: GuildRow[]
}

function timeAgo(iso: string): string {
  const seconds = Math.max(0, (Date.now() - Date.parse(iso)) / 1000)
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

export default function Index({ stats, my_hours }: { stats: RelightStats; my_hours: number }) {
  const shared = usePage<SharedProps>().props
  const [revealed, setRevealed] = useState(0)

  useEffect(() => {
    const frame = requestAnimationFrame(() => setRevealed(stats.percent))
    return () => cancelAnimationFrame(frame)
  }, [stats.percent])

  const embers = useMemo(
    () =>
      Array.from({ length: 6 + Math.round(stats.percent / 8) }, () => ({
        left: `${5 + Math.random() * 90}%`,
        animationDelay: `${Math.random() * 4}s`,
        animationDuration: `${2.5 + Math.random() * 3}s`,
      })),
    [stats.percent]
  )

  const currentMilestone = [...stats.milestones].reverse().find((m) => m.reached)
  const nextMilestone = stats.milestones.find((m) => !m.reached)
  const relit = stats.percent >= 100

  const heroHeight = shared.forge_ui_enabled
    ? 'min-h-[calc(100vh-3.5rem)]'
    : 'min-h-[calc(100vh-3.5rem)] md:min-h-screen'

  const fireLayer = {
    backgroundImage: "url('/ai_check_bg.png')",
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'bottom center',
    backgroundSize: '100% auto',
  } as const

  return (
    <div className="min-h-screen text-stone-200">
      <Head title="Relight the Forge" />

      <section className={`relative ${heroHeight} overflow-hidden bg-[#0e0e0e] flex items-center justify-center`}>
        <div
          className="absolute inset-0"
          style={{ ...fireLayer, filter: 'grayscale(1) brightness(0.35)', opacity: 0.5 }}
        />
        <div
          className="absolute inset-0 forge-overlay-idle"
          style={{
            ...fireLayer,
            clipPath: `inset(${100 - revealed}% 0 0 0)`,
            transition: 'clip-path 1.2s ease-out',
          }}
        />
        <div
          className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#ca5924]/20 to-transparent pointer-events-none"
          style={{ height: `${Math.max(revealed, 8)}%`, transition: 'height 1.2s ease-out' }}
        />
        {embers.map((e, i) => (
          <span key={i} className="forge-ember" style={e} />
        ))}

        <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
          <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-stone-500 mb-3">
            A community quest &middot; {stats.days_remaining} days remaining
          </p>
          <h1 className="text-5xl sm:text-7xl font-headline font-bold text-[#e5e2e1] tracking-tight mb-4">
            Relight the Forge
          </h1>
          <p className="text-stone-400 text-sm sm:text-base mb-6">
            The great forge has gone cold. Every project you build feeds the flame. Your job as a community is to keep feeding the fire and then together
            we&apos;ll bring the forge <span className="text-[#e3b24c] font-bold">roaring back to life</span>!
          </p>
          <p className="text-2xl sm:text-3xl font-headline text-[#ca5924]">
            {relit ? 'The Forge burns once more.' : (currentMilestone?.name ?? 'Cold Coals')}
          </p>
          {!relit && nextMilestone && (
            <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-stone-500 mt-2">
              Next: {nextMilestone.name}
            </p>
          )}
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
        <section className="bg-[#1c1b1b] ghost-border p-6 sm:p-8">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-stone-500">The relighting</p>
            <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-[#ffb595]">
              {Math.floor(stats.percent)}% relit
            </span>
          </div>
          <div className="h-3 bg-[#0e0e0e] ghost-border overflow-hidden">
            <div
              className="h-full signature-smolder transition-all duration-500"
              style={{ width: `${stats.percent}%` }}
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mt-8">
            {stats.milestones.map((m) => (
              <div
                key={m.name}
                className={`ghost-border p-3 text-center ${m.reached ? 'bg-[#ca5924]/10' : 'bg-[#0e0e0e]'}`}
              >
                <span
                  className={`material-symbols-outlined text-2xl ${m.reached ? 'text-[#ca5924]' : 'text-stone-600'}`}
                  style={m.reached ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  local_fire_department
                </span>
                <p
                  className={`font-headline text-sm mt-1 ${m.reached ? 'text-[#e5e2e1]' : 'text-stone-600'}`}
                >
                  {m.name}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-[#1c1b1b] ghost-border p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-stone-500 mb-1">Your contribution</p>
            <p className="text-2xl font-headline font-bold text-[#e5e2e1]">
              You&apos;ve fed the forge <span className="text-[#e3b24c]">{my_hours}h</span>
            </p>
          </div>
          {my_hours === 0 && (
            <Link
              href="/projects/new"
              className="signature-smolder text-[#4c1a00] px-4 py-2 font-bold uppercase tracking-wider text-xs flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-base">local_fire_department</span>
              Feed the forge
            </Link>
          )}
        </section>

        <div className="grid md:grid-cols-2 gap-8">
          <section className="bg-[#1c1b1b] ghost-border p-6">
            <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-stone-500 mb-4">The forge is fed</p>
            {stats.ember_feed.length === 0 ? (
              <p className="text-stone-500 text-sm">No hours yet &mdash; be the first to feed the flame.</p>
            ) : (
              <ul className="space-y-3">
                {stats.ember_feed.map((entry) => (
                  <li key={entry.id} className="flex items-center gap-3">
                    {entry.user.avatar ? (
                      <img src={entry.user.avatar} alt="" className="w-8 h-8 object-cover shrink-0" />
                    ) : (
                      <div className="w-8 h-8 bg-[#0e0e0e] ghost-border shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-stone-200 truncate">
                        <span className="font-bold">{entry.user.display_name}</span> FED the forge with{' '}
                        <span className="text-[#ffb595] font-bold">{entry.project.name}</span>
                      </p>
                    </div>
                    <span className="text-[10px] uppercase tracking-wider font-bold text-stone-600 shrink-0">
                      {timeAgo(entry.created_at)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="bg-[#1c1b1b] ghost-border p-6">
            <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-stone-500 mb-4">
              This week&apos;s stoking
            </p>
            <ul className="space-y-4">
              {stats.guild_race.map((row, i) => {
                const mine = shared.auth.user?.guild === row.name
                return (
                  <li key={row.name}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span
                        className={`material-symbols-outlined text-lg ${i === 0 ? 'text-[#e3b24c]' : 'text-stone-500'}`}
                      >
                        {row.icon}
                      </span>
                      <span
                        className={`font-headline capitalize ${mine ? 'text-[#ffb595]' : 'text-stone-200'}`}
                      >
                        {row.name}
                      </span>
                      {i === 0 && (
                        <span className="material-symbols-outlined text-sm text-[#e3b24c]">trophy</span>
                      )}
                      <span className="ml-auto text-sm font-bold tabular-nums text-stone-400">{row.hours}h</span>
                    </div>
                    <div className="h-1.5 bg-[#0e0e0e] overflow-hidden">
                      <div className="h-full signature-smolder" style={{ width: `${row.share}%` }} />
                    </div>
                  </li>
                )
              })}
            </ul>
          </section>
        </div>
      </div>

      <style>{`
        .forge-overlay-idle { animation: forge-idle 4.5s ease-in-out infinite; }
        @keyframes forge-idle {
          0%, 100% { filter: brightness(1); }
          50% { filter: brightness(1.08) drop-shadow(0 0 8px rgba(202,89,36,0.22)); }
        }
        .forge-ember {
          position: absolute; bottom: 0; width: 3px; height: 3px; border-radius: 9999px;
          background: #ffb24a; box-shadow: 0 0 6px 1px rgba(255,150,50,0.85); opacity: 0;
          animation-name: forge-ember-rise; animation-timing-function: ease-out; animation-iteration-count: infinite;
        }
        @keyframes forge-ember-rise {
          0% { transform: translateY(0) scale(1); opacity: 0; }
          12% { opacity: 1; }
          70% { opacity: 0.8; }
          100% { transform: translateY(-170px) translateX(14px) scale(0.3); opacity: 0; }
        }
      `}</style>
    </div>
  )
}
