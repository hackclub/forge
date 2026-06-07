import { useState } from 'react'
import { Head, router } from '@inertiajs/react'

interface GuildOption {
  name: string
  tagline: string
  icon: string
}

const GUILD_ACCENT: Record<string, { ring: string; glow: string }> = {
  rivendell: { ring: 'ring-emerald-300/40', glow: 'from-emerald-400/20' },
  erebor: { ring: 'ring-amber-400/50', glow: 'from-amber-500/25' },
  edoras: { ring: 'ring-yellow-300/40', glow: 'from-yellow-300/20' },
  valinor: { ring: 'ring-violet-300/40', glow: 'from-violet-300/20' },
}

export default function GuildChoicesNew({ guilds }: { guilds: GuildOption[] }) {
  const [selected, setSelected] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function confirm() {
    if (!selected) return
    setSubmitting(true)
    router.post('/guilds/choose', { guild: selected }, { onFinish: () => setSubmitting(false) })
  }

  return (
    <div className="min-h-screen text-stone-200">
      <Head title="Choose your guild" />
      <div className="max-w-5xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-headline font-bold tracking-tighter text-[#e5e2e1]">
            Pick your guild
          </h1>
          <p className="text-stone-500 text-sm md:text-base mt-3 max-w-xl mx-auto">
            You'll join your guild's private channel and work together as a team to get weekly rewards! The more people and activity you have in your guild, the more rewards you get!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {guilds.map((g) => {
            const isSelected = selected === g.name
            const accent = GUILD_ACCENT[g.name] || GUILD_ACCENT.rivendell
            return (
              <button
                key={g.name}
                type="button"
                onClick={() => setSelected(g.name)}
                className={`relative text-left p-6 bg-[#1c1b1b] border border-white/5 transition-all duration-150 corner-accents cursor-pointer overflow-hidden ${
                  isSelected ? `ring-2 ${accent.ring} bg-[#252423]` : 'hover:bg-[#252423]'
                }`}
              >
                <div
                  className={`absolute -top-20 -right-20 w-48 h-48 bg-gradient-radial ${accent.glow} to-transparent rounded-full blur-2xl pointer-events-none`}
                />
                <div className="relative flex items-start gap-4">
                  <span
                    className="material-symbols-outlined text-4xl text-[#ca5924] shrink-0"
                    style={isSelected ? { fontVariationSettings: "'FILL' 1" } : undefined}
                  >
                    {g.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-2xl font-headline font-bold tracking-tight text-[#e5e2e1] capitalize">
                      {g.name}
                    </h2>
                    <p className="text-stone-500 text-sm mt-1.5 leading-relaxed">{g.tagline}</p>
                  </div>
                  {isSelected && (
                    <span
                      className="material-symbols-outlined text-[#ca5924] text-xl shrink-0"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      check_circle
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-stone-600 uppercase tracking-wider">
            {selected ? (
              <>
                Selected: <span className="text-[#ffb595]">{selected}</span>
              </>
            ) : (
              'No guild selected'
            )}
          </p>
          <button
            type="button"
            disabled={!selected || submitting}
            onClick={confirm}
            className="signature-smolder text-[#4c1a00] font-headline font-bold py-3 px-8 rounded-lg flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-lg">shield</span>
            <span>{submitting ? 'Joining...' : 'Confirm guild'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
