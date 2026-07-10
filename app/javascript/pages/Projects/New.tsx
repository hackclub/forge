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
    rate: '5.0c / hour',
    description:
      'Basic project. The simplest starting point for things like PCB Buisness Cards, LED timers, DIY Mouse. Should be $0-50',
    pitch: false,
  },
  {
    tier: 'tier_3',
    label: 'Tier 3',
    rate: '5.5c / hour',
    description: 'Standard projects such as a macropad on wheels, custom bluetooth speakers, Devboard. Around $0-100',
    pitch: false,
  },
  {
    tier: 'tier_2',
    label: 'Tier 2',
    rate: '6.5c / hour',
    description: 'Bigger builds. Eg DIY game console, Full Split Keyboard, Custom Flipper Zero. Around $0-200',
    pitch: false,
  },
  {
    tier: 'tier_1',
    label: 'Tier 1',
    rate: '7.5c / hour',
    description:
      'Advanced project ($200+).Requires a Slack pitch. Eg a DIY 3d printer, Battlebot with custom attachements. For projects $0-200+',
    pitch: true,
  },
]

interface Path {
  key: 'project_review' | 'build_review'
  label: string
  description: string
  href: string
  highlight?: boolean
}

const PATHS: Path[] = [
  {
    key: 'project_review',
    label: 'Project Review',
    description:
      'Pitch a new project for funding. Pick a tier, document your build, and earn steel coins per hour you log.',
    href: '/projects/new?path=project_review',
  },
  {
    key: 'build_review',
    label: 'Build Review',
    description:
      'Already funded? Submit build time on an existing project. Earns 5.0c / hour. A lapse link on each journal is highly recommended.',
    href: '/projects/new?tier=tier_build_review',
    highlight: true,
  },
]

export default function ProjectsNew({ step = 'choose' }: { step?: 'choose' | 'tiers' }) {
  if (step === 'tiers') {
    return (
      <div className="p-5 md:p-12 max-w-4xl mx-auto text-center min-h-screen flex flex-col justify-center">
        <h1 className="text-4xl font-headline font-bold text-[#e5e2e1] tracking-tight mb-3">Pick a tier</h1>
        <p className="text-stone-400 text-sm mb-2">
          Each tier earns a different rate of steel coins per hour you log on the project.
        </p>
        <p className="text-stone-500 text-sm mb-10">
          Not sure what tier to pitch? Ask in <span className="text-[#ffb595] font-bold">#forge-help</span>!
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {TIERS.map((t) => (
            <Link
              key={t.tier}
              href={`/projects/new?tier=${t.tier}`}
              className={`group bg-[#1c1b1b] ghost-border p-7 hover:bg-[#2a2a2a] transition-colors flex flex-col gap-3 text-center items-center corner-accents ${t.pitch ? 'border border-[#ca5924]/20' : ''}`}
            >
              <div className="flex items-center justify-center gap-3">
                <h2 className="text-xl font-headline font-bold text-[#e5e2e1]">{t.label}</h2>
                <span className="text-xs font-bold uppercase tracking-[0.15em] text-[#ca5924]">{t.rate}</span>
              </div>
              <p className="text-stone-400 text-sm leading-relaxed">{t.description}</p>
              <div className="mt-auto pt-3">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-stone-500 group-hover:text-[#ffb595] transition-colors flex items-center justify-center gap-1">
                  {t.pitch ? 'Learn more' : 'Get started'}
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </span>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          <Link
            href="/projects/new"
            className="text-xs font-bold uppercase tracking-[0.2em] text-stone-500 hover:text-[#ffb595] transition-colors flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Back
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-5 md:p-12 max-w-4xl mx-auto text-center min-h-screen flex flex-col justify-center">
      <h1 className="text-4xl font-headline font-bold text-[#e5e2e1] tracking-tight mb-3">New Project</h1>
      <p className="text-stone-400 text-sm mb-10">Choose what you want to submit.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {PATHS.map((p) => (
          <Link
            key={p.key}
            href={p.href}
            className={`group bg-[#1c1b1b] ghost-border p-7 hover:bg-[#2a2a2a] transition-colors flex flex-col gap-3 text-center items-center corner-accents ${p.highlight ? 'border border-[#ffb595]/30' : ''}`}
          >
            <h2 className="text-xl font-headline font-bold text-[#e5e2e1]">{p.label}</h2>
            <p className="text-stone-400 text-sm leading-relaxed">{p.description}</p>
            <div className="mt-auto pt-3">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-stone-500 group-hover:text-[#ffb595] transition-colors flex items-center justify-center gap-1">
                Get started
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
