import type { ProjectTier } from '@/types'

export const TIER_COIN_RATES: Record<ProjectTier, number> = {
  tier_1: 7.5,
  tier_2: 6.5,
  tier_3: 5.0,
  tier_4: 4.5,
  tier_build_review: 5.0,
}

export function formatCoinRate(rate: number): string {
  return `${rate.toFixed(1)}c/hr`
}

export function tierCoinRate(tier: ProjectTier): string {
  return formatCoinRate(TIER_COIN_RATES[tier])
}

export interface TierOption {
  tier: Exclude<ProjectTier, 'tier_build_review'>
  label: string
  description: string
  pitch: boolean
}

export const TIER_OPTIONS: TierOption[] = [
  {
    tier: 'tier_4',
    label: 'Tier 4',
    description:
      'Basic project. The simplest starting point for things like PCB Buisness Cards, LED timers, DIY Mouse. Should be $0-50',
    pitch: false,
  },
  {
    tier: 'tier_3',
    label: 'Tier 3',
    description: 'Standard projects such as a macropad on wheels, custom bluetooth speakers, Devboard. Around $0-100',
    pitch: false,
  },
  {
    tier: 'tier_2',
    label: 'Tier 2',
    description: 'Bigger builds. Eg DIY game console, Full Split Keyboard, Custom Flipper Zero. Around $0-200',
    pitch: false,
  },
  {
    tier: 'tier_1',
    label: 'Tier 1',
    description:
      'Advanced project ($200+).Requires a Slack pitch. Eg a DIY 3d printer, Battlebot with custom attachements. For projects $0-200+',
    pitch: true,
  },
]
