import { Head, Link } from '@inertiajs/react'

interface GuildSummary {
  name: string
  tagline: string
  icon: string
  member_count: number
  multiplier: number
  computed_at: string | null
}

const ACCENT: Record<string, string> = {
  rivendell: 'text-emerald-300',
  erebor: 'text-amber-300',
  edoras: 'text-yellow-200',
  valinor: 'text-violet-200',
}

export default function GuildsIndex({ mine, guilds }: { mine: string | null; guilds: GuildSummary[] }) {
  const myGuild = guilds.find((g) => g.name === mine)

  return (
    <div className="min-h-screen bg-[#0e0e0e] text-stone-200">
      <Head title="Guilds" />
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-10">
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#ca5924] font-bold mb-2">Guilds</p>
          <h1 className="text-3xl md:text-4xl font-headline font-bold tracking-tighter text-[#e5e2e1]">
            Four houses, one forge.
          </h1>
          <p className="text-stone-500 text-sm mt-2 max-w-2xl">
            Each guild has a private channel, a weekly activity multiplier that boosts every member's coin gains, and a
            referral leaderboard.
          </p>
        </div>

        {myGuild && (
          <div className="mb-10">
            <p className="text-[10px] uppercase tracking-[0.3em] text-stone-500 font-bold mb-3">Your guild</p>
            <Link
              href={`/guilds/${myGuild.name}`}
              className="block relative bg-[#1c1b1b] border border-[#ca5924]/30 corner-accents p-6 hover:bg-[#252423] transition-colors"
            >
              <div className="flex items-start gap-4">
                <span
                  className={`material-symbols-outlined text-5xl shrink-0 ${ACCENT[myGuild.name] || 'text-[#ca5924]'}`}
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  {myGuild.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <h2 className="text-2xl md:text-3xl font-headline font-bold tracking-tight text-[#e5e2e1] capitalize">
                    {myGuild.name}
                  </h2>
                  <p className="text-stone-500 text-sm mt-1">{myGuild.tagline}</p>
                  <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 text-sm">
                    <span className="text-stone-400">
                      <span className="text-[#ffb595] font-headline font-bold tabular-nums">
                        {myGuild.multiplier.toFixed(2)}×
                      </span>{' '}
                      <span className="text-[10px] uppercase tracking-widest text-stone-600 ml-1">multiplier</span>
                    </span>
                    <span className="text-stone-400">
                      <span className="text-[#e5e2e1] font-headline font-bold tabular-nums">
                        {myGuild.member_count}
                      </span>{' '}
                      <span className="text-[10px] uppercase tracking-widest text-stone-600 ml-1">members</span>
                    </span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-stone-500 self-center shrink-0">arrow_forward</span>
              </div>
            </Link>
          </div>
        )}

        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-stone-500 font-bold mb-3">All guilds</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {guilds.map((g) => {
              const isMine = mine === g.name
              return (
                <Link
                  key={g.name}
                  href={`/guilds/${g.name}`}
                  className={`relative bg-[#1c1b1b] border border-white/5 corner-accents p-5 hover:bg-[#252423] transition-colors ${
                    isMine ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`material-symbols-outlined text-3xl shrink-0 ${ACCENT[g.name] || 'text-[#ca5924]'}`}
                    >
                      {g.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-headline font-bold tracking-tight text-[#e5e2e1] capitalize">
                        {g.name}
                      </h3>
                      <p className="text-stone-500 text-xs mt-1 line-clamp-2">{g.tagline}</p>
                      <div className="flex gap-4 mt-3 text-xs">
                        <span className="text-stone-400">
                          <span className="text-[#ffb595] font-headline font-bold tabular-nums">
                            {g.multiplier.toFixed(2)}×
                          </span>
                        </span>
                        <span className="text-stone-400">
                          <span className="text-[#e5e2e1] font-headline font-bold tabular-nums">{g.member_count}</span>{' '}
                          <span className="text-stone-600">members</span>
                        </span>
                      </div>
                    </div>
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
