import type { ProjectStatus } from '@/types'

export interface DashboardProject {
  id: number
  name: string
  subtitle: string | null
  status: ProjectStatus
  cover_image_url: string | null
  updated_at: string
}

export const STATUS_LABELS: Record<ProjectStatus, string> = {
  draft: 'Draft',
  pending: 'Pending',
  approved: 'Approved',
  returned: 'Returned',
  rejected: 'Rejected',
  pitch_approved: 'Pitch Approved',
  pitch_pending: 'Pitch Review',
}

export const STATUS_COLORS: Record<ProjectStatus, string> = {
  draft: 'bg-stone-500/15 text-stone-400',
  pending: 'bg-amber-500/15 text-amber-400',
  approved: 'bg-emerald-500/15 text-emerald-400',
  returned: 'bg-orange-500/15 text-orange-400',
  rejected: 'bg-red-500/15 text-red-400',
  pitch_approved: 'bg-emerald-500/15 text-emerald-400',
  pitch_pending: 'bg-amber-500/15 text-amber-400',
}
