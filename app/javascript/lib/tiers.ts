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
