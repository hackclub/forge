import { Badge } from '@/components/admin/ui/badge'
import type { ProjectStatus } from '@/types'

export function isSafeUrl(url: string | null | undefined): url is string {
  if (!url) return false
  try {
    const p = new URL(url)
    return p.protocol === 'http:' || p.protocol === 'https:'
  } catch {
    return false
  }
}

export function statusBadge(status: ProjectStatus) {
  switch (status) {
    case 'approved':
      return <Badge variant="success">Approved</Badge>
    case 'returned':
      return <Badge variant="warning">Returned</Badge>
    case 'rejected':
      return <Badge variant="destructive">Rejected</Badge>
    case 'pending':
      return <Badge variant="warning">Pending</Badge>
    case 'pitch_approved':
      return <Badge variant="success">Pitch Approved</Badge>
    case 'pitch_pending':
      return <Badge variant="warning">Pitch Pending</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

export function verdictBadge(verdict: 'pass' | 'fail' | 'uncertain' | 'error') {
  switch (verdict) {
    case 'pass':
      return <Badge variant="success">Pass</Badge>
    case 'fail':
      return <Badge variant="destructive">Fail</Badge>
    // A checker that crashed is not the same as a project we are unsure about,
    // and showing "Uncertain" for it reads as a judgement that was never made.
    case 'error':
      return <Badge variant="destructive">Check failed</Badge>
    default:
      return <Badge variant="warning">Uncertain</Badge>
  }
}
