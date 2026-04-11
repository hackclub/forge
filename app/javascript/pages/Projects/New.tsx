import { Link } from '@inertiajs/react'

interface TierOption {
  tier: 'tier_1' | 'tier_2' | 'tier_3' | 'tier_4'
  label: string
  rate: string
  description: string
  pitch: boolean
}

const TIERS: TierOption[] = [
  {
    tier: 'tier_4',
    label: 'Tier 4',
    rate: '4c / hour',
    description: 'Basic project. The simplest starting point for things like PCB Buisness Cards, LED timers, DIY Mouse. Should be $0-50',
    pitch: false,
  },
  {
    tier: 'tier_3',
    label: 'Tier 3',
    rate: '4.5c / hour',
    description: 'Standard projects such as a macropad on wheels, custom bluetooth speakers, Devboard. Around $50-100',
    pitch: false,
  },
  {
    tier: 'tier_2',
    label: 'Tier 2',
    rate: '5.5c / hour',
    description: 'Bigger builds. Eg DIY game console, Full Split Keyboard, Custom Flipper Zero. Around $100-200',
    pitch: false,
  },
  {
    tier: 'tier_1',
    label: 'Tier 1',
    rate: '7.25c / hour',
    description: 'Advanced project ($200+).Requires a Slack pitch. Eg a DIY 3d printer, Battlebot with custom attachements. For projects $200+',
    pitch: true,
  },
]

export default function ProjectsNew() {
  return (
    <div className="p-5 md:p-12 max-w-4xl mx-auto">
      <h1 className="text-4xl font-headline font-bold text-[#e5e2e1] tracking-tight mb-3">New Project</h1>
      <p className="text-stone-400 text-sm mb-10">Pick a tier. Each tier earns a different rate of steel coins per hour you log on the project.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {TIERS.map((t) => (
          <Link
            key={t.tier}
            href={`/projects/new?tier=${t.tier}`}
            className={`group bg-[#1c1b1b] ghost-border p-7 hover:bg-[#2a2a2a] transition-colors flex flex-col gap-3 ${t.pitch ? 'border border-[#ee671c]/20' : ''}`}
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-headline font-bold text-[#e5e2e1]">{t.label}</h2>
              <span className="text-xs font-bold uppercase tracking-[0.15em] text-[#ee671c]">{t.rate}</span>
            </div>
            <p className="text-stone-400 text-sm leading-relaxed">{t.description}</p>
            <div className="mt-auto pt-3">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-stone-500 group-hover:text-[#ffb595] transition-colors flex items-center gap-1">
                {t.pitch ? 'Learn more' : 'Get started'}
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
