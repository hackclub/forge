import { router, Link } from '@inertiajs/react'
import { Activity, ArrowRight } from 'lucide-react'
import { Badge } from '@/components/admin/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/admin/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/admin/ui/table'
import AdminPagination from '@/components/admin/AdminPagination'
import { cn } from '@/components/admin/lib/cn'
import { formatSeconds } from '@/hooks/useReviewHeartbeat'
import type { PagyProps } from '@/types'

interface SessionRow {
  id: number
  reviewer_id: number
  reviewer_name: string
  project_id: number
  project_name: string
  started_at: string
  ended_at: string | null
  active_seconds: number
  decision: string | null
}

interface ReviewerTotal {
  reviewer_id: number
  reviewer_name: string
  active_seconds: number
  wall_seconds: number
  reviews_count: number
  hourly_estimate_usd: number
  per_review_estimate_usd: number
  estimated_payment_usd: number
}

function decisionBadge(decision: string | null) {
  if (!decision) return <Badge variant="warning">in progress</Badge>
  switch (decision) {
    case 'approved':
      return <Badge variant="success">approved</Badge>
    case 'returned':
      return <Badge variant="warning">returned</Badge>
    case 'rejected':
      return <Badge variant="destructive">rejected</Badge>
    default:
      return <Badge variant="secondary">{decision}</Badge>
  }
}

function Leaderboard({
  title,
  description,
  totals,
  sortKey,
  onPickReviewer,
}: {
  title: string
  description: string
  totals: ReviewerTotal[]
  sortKey: 'active_seconds' | 'wall_seconds'
  onPickReviewer: (id: number) => void
}) {
  const sorted = [...totals].sort((a, b) => b[sortKey] - a[sortKey])
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">{description}</p>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">#</TableHead>
              <TableHead>Reviewer</TableHead>
              <TableHead>Active</TableHead>
              <TableHead>Wall</TableHead>
              <TableHead className="text-right">Reviews</TableHead>
              <TableHead className="text-right">Est. Pay</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((t, idx) => {
              const basis = t.hourly_estimate_usd >= t.per_review_estimate_usd ? 'hourly' : 'per-review'
              const tooltip = `Hourly: $${t.hourly_estimate_usd.toFixed(2)} (${(t.active_seconds / 3600).toFixed(2)}h × $15)\nPer-review: $${t.per_review_estimate_usd.toFixed(2)} (${t.reviews_count} × $0.33)\nUsing ${basis} (whichever is higher)`
              return (
                <TableRow
                  key={t.reviewer_id}
                  className="cursor-pointer"
                  onClick={() => onPickReviewer(t.reviewer_id)}
                >
                  <TableCell className="text-muted-foreground font-mono text-xs">{idx + 1}</TableCell>
                  <TableCell>
                    <Link
                      href={`/admin/users/${t.reviewer_id}`}
                      className="hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {t.reviewer_name}
                    </Link>
                  </TableCell>
                  <TableCell className={cn('font-mono text-sm', sortKey === 'active_seconds' && 'font-semibold')}>
                    {formatSeconds(t.active_seconds)}
                  </TableCell>
                  <TableCell className={cn('font-mono text-sm', sortKey === 'wall_seconds' && 'font-semibold')}>
                    {formatSeconds(t.wall_seconds)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs">{t.reviews_count}</TableCell>
                  <TableCell className="text-right font-mono text-sm" title={tooltip}>
                    ${t.estimated_payment_usd.toFixed(2)}
                    <span className="text-[10px] text-muted-foreground ml-1">({basis === 'hourly' ? 'hr' : 'per'})</span>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

export default function ReviewAuditsIndex({
  sessions,
  pagy,
  filters: f,
  totals,
}: {
  sessions: SessionRow[]
  pagy: PagyProps
  filters: { reviewer_id: string; project_id: string }
  totals: ReviewerTotal[]
}) {
  function applyFilter(key: string, value: string) {
    router.get('/admin/review_audits', { ...f, [key]: value || undefined }, { preserveState: true })
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <Activity className="size-5" />
          Review Audits
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Every completed review — reviewer, project, active seconds, and a full audit trail of what happened. Superadmin only.
        </p>
      </div>

      {totals.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground text-center">No completed reviews yet.</CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Leaderboard
            title="Active time leaderboard"
            description="Sum of heartbeat-measured active time across completed reviews. The basis for reviewer payouts."
            totals={totals}
            sortKey="active_seconds"
            onPickReviewer={(id) => applyFilter('reviewer_id', String(id))}
          />
          <Leaderboard
            title="Wall-clock leaderboard"
            description="Sum of started_at→ended_at durations across completed reviews. Includes idle/AFK time. Use the gap vs active to spot inefficient reviewers."
            totals={totals}
            sortKey="wall_seconds"
            onPickReviewer={(id) => applyFilter('reviewer_id', String(id))}
          />
        </div>
      )}

      {(f.reviewer_id || f.project_id) && (
        <div className="flex gap-2 flex-wrap items-center">
          <button
            onClick={() => router.get('/admin/review_audits')}
            className="text-xs text-muted-foreground hover:text-foreground cursor-pointer underline"
          >
            clear filters
          </button>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Completed reviews</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-10 text-center">No completed reviews match.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Reviewer</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Ended</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Decision</TableHead>
                  <TableHead className="w-12 text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((s) => (
                  <TableRow
                    key={s.id}
                    className="cursor-pointer"
                    onClick={() => router.visit(`/admin/review_audits/${s.id}`)}
                  >
                    <TableCell className="font-medium">{s.project_name}</TableCell>
                    <TableCell>{s.reviewer_name}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{s.started_at}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{s.ended_at || '—'}</TableCell>
                    <TableCell className="font-mono text-sm">{formatSeconds(s.active_seconds)}</TableCell>
                    <TableCell>{decisionBadge(s.decision)}</TableCell>
                    <TableCell className="text-right">
                      <ArrowRight className="size-4 text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {pagy && pagy.pages > 1 && <AdminPagination pagy={pagy} />}
        </CardContent>
      </Card>
    </div>
  )
}
