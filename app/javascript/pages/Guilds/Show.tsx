import { Head, Link } from '@inertiajs/react'

interface GuildDetail {
  name: string
  tagline: string
  icon: string
  multiplier: number
  members_active_week: number
  referrals_week: number
  computed_at: string | null
}

interface Member {
  id: number
  display_name: string
  avatar: string
}

interface Referrer extends Member {
  referrals: number
}

const ACCENT: Record<string, string> = {
  rivendell: 'text-emerald-300',
  erebor: 'text-amber-300',
  edoras: 'text-yellow-200',
  valinor: 'text-violet-200',
}

export default function GuildsShow({
  guild,
  mine,
  member_count,
  members,
  top_referrers,
}: {
  guild: GuildDetail
  mine: boolean
  member_count: number
  members: Member[]
  top_referrers: Referrer[]
}) {
  const accent = ACCENT[guild.name] || 'text-[#ca5924]'

  return (
    <div className="min-h-screen bg-[#0e0e0e] text-stone-200">
      <Head title={`${guild.name} — Guild`} />
      <div className="max-w-5xl mx-auto px-6 py-10">
        <Link
          href="/guilds"
          className="text-xs text-stone-500 hover:text-[#ffb595] uppercase tracking-widest font-bold inline-flex items-center gap-1 mb-6"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          All guilds
        </Link>

        <div className="bg-[#1c1b1b] border border-white/5 corner-accents p-8 mb-8 relative overflow-hidden">
          <div
            className={`absolute -top-24 -right-24 w-64 h-64 rounded-full blur-3xl opacity-30 ${accent.replace('text-', 'bg-')}`}
          />
          <div className="relative flex items-start gap-5">
            <span
              className={`material-symbols-outlined text-6xl shrink-0 ${accent}`}
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              {guild.icon}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-3xl md:text-4xl font-headline font-bold tracking-tighter text-[#e5e2e1] capitalize">
                  {guild.name}
                </h1>
                {mine && (
                  <span className="text-[10px] uppercase tracking-widest text-[#ca5924] font-bold bg-[#ca5924]/10 px-2 py-1">
                    Your guild
                  </span>
                )}
              </div>
              <p className="text-stone-500 text-sm md:text-base mt-2">{guild.tagline}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
          <div className="bg-[#1c1b1b] border border-white/5 p-4">
            <p className="text-[10px] uppercase tracking-widest text-stone-600 font-bold">This week</p>
            <p className="text-2xl font-headline font-bold text-[#ffb595] mt-2 tabular-nums">
              {guild.multiplier.toFixed(2)}×
            </p>
            <p className="text-[10px] uppercase tracking-widest text-stone-600 mt-1">multiplier</p>
          </div>
          <div className="bg-[#1c1b1b] border border-white/5 p-4">
            <p className="text-[10px] uppercase tracking-widest text-stone-600 font-bold">Members</p>
            <p className="text-2xl font-headline font-bold text-[#e5e2e1] mt-2 tabular-nums">{member_count}</p>
            <p className="text-[10px] uppercase tracking-widest text-stone-600 mt-1">total</p>
          </div>
          <div className="bg-[#1c1b1b] border border-white/5 p-4">
            <p className="text-[10px] uppercase tracking-widest text-stone-600 font-bold">Active</p>
            <p className="text-2xl font-headline font-bold text-[#e5e2e1] mt-2 tabular-nums">
              {guild.members_active_week}
            </p>
            <p className="text-[10px] uppercase tracking-widest text-stone-600 mt-1">this week</p>
          </div>
          <div className="bg-[#1c1b1b] border border-white/5 p-4">
            <p className="text-[10px] uppercase tracking-widest text-stone-600 font-bold">Referrals</p>
            <p className="text-2xl font-headline font-bold text-[#e5e2e1] mt-2 tabular-nums">{guild.referrals_week}</p>
            <p className="text-[10px] uppercase tracking-widest text-stone-600 mt-1">this week</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <section>
            <h2 className="text-xl font-headline font-bold text-[#e5e2e1] tracking-tight mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#ca5924]">emoji_events</span>
              Top referrers
            </h2>
            {top_referrers.length === 0 ? (
              <p className="text-stone-600 text-sm italic">No approved referrals from this guild yet.</p>
            ) : (
              <div className="ghost-border divide-y divide-white/5">
                {top_referrers.map((r, idx) => (
                  <Link
                    key={r.id}
                    href={`/users/${r.id}`}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#252423] transition-colors"
                  >
                    <span
                      className={`font-headline font-bold text-sm w-6 shrink-0 ${idx === 0 ? 'text-[#ca5924]' : idx < 3 ? 'text-[#ffb595]' : 'text-stone-500'}`}
                    >
                      {idx + 1}
                    </span>
                    <img src={r.avatar} alt="" className="w-8 h-8 border border-white/5 shrink-0" />
                    <span className="font-headline font-bold text-[#e5e2e1] text-sm flex-1 min-w-0 truncate">
                      {r.display_name}
                    </span>
                    <span className="text-[#ffb595] font-headline font-bold tabular-nums">{r.referrals}</span>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-xl font-headline font-bold text-[#e5e2e1] tracking-tight mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#ca5924]">groups</span>
              Members
            </h2>
            {members.length === 0 ? (
              <p className="text-stone-600 text-sm italic">No one has joined this guild yet.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {members.map((m) => (
                  <Link
                    key={m.id}
                    href={`/users/${m.id}`}
                    className="flex items-center gap-2 p-2 hover:bg-[#252423] transition-colors ghost-border"
                  >
                    <img src={m.avatar} alt="" className="w-7 h-7 border border-white/5 shrink-0" />
                    <span className="text-sm text-stone-300 truncate">{m.display_name}</span>
                  </Link>
                ))}
              </div>
            )}
            {member_count > members.length && (
              <p className="text-xs text-stone-600 mt-3 italic">
                Showing {members.length} of {member_count} members.
              </p>
            )}
          </section>
        </div>

        {guild.computed_at && (
          <p className="text-[10px] uppercase tracking-widest text-stone-700 text-center mt-10">
            Multiplier last computed {guild.computed_at}
          </p>
        )}
      </div>
    </div>
  )
}
