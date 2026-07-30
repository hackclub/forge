import { Link, router } from '@inertiajs/react'
import { ChevronLeft, ChevronRight, Trophy } from 'lucide-react'
import { Badge } from '@/components/admin/ui/badge'
import { Button } from '@/components/admin/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/admin/ui/table'
import { cn } from '@/components/admin/lib/cn'
import { formatDuration } from '@/components/admin/review/QueueStatCards'

interface LeaderboardRow {
  user_id: number
  display_name: string
  avatar: string
  approved: number
  returned: number
  rejected: number
  pitches: number
  total: number
  active_seconds: number
}

const rankStyles = [
  'text-amber-500',
  'text-zinc-400',
  'text-orange-700 dark:text-orange-400',
]

export default function AdminReviewsLeaderboard({
  rows,
  week_label,
  is_current_week,
  prev_week,
  next_week,
}: {
  rows: LeaderboardRow[]
  week_label: string
  is_current_week: boolean
  prev_week: string
  next_week: string | null
}) {
  function goToWeek(week: string) {
    router.get('/admin/reviews/leaderboard', { week }, { preserveState: true })
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Review Leaderboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Decisions made per reviewer, week by week. Time comes from recorded review sessions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => goToWeek(prev_week)} title="Previous week">
            <ChevronLeft className="size-4" />
          </Button>
          <span className="text-sm font-medium min-w-40 text-center">
            {week_label}
            {is_current_week && <span className="text-muted-foreground font-normal"> (this week)</span>}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => next_week && goToWeek(next_week)}
            disabled={!next_week}
            title="Next week"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <div className="rounded-md border border-border bg-card overflow-hidden">
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground py-12 text-center">No reviews recorded this week.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Reviewer</TableHead>
                <TableHead className="text-right">Reviews</TableHead>
                <TableHead className="text-right">Approved</TableHead>
                <TableHead className="text-right">Returned</TableHead>
                <TableHead className="text-right">Rejected</TableHead>
                <TableHead className="text-right">Pitches</TableHead>
                <TableHead className="text-right">Review Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, i) => (
                <TableRow key={row.user_id} className="hover:bg-muted/20 transition-colors">
                  <TableCell>
                    {i < 3 ? (
                      <Trophy className={cn('size-4', rankStyles[i])} />
                    ) : (
                      <span className="text-xs text-muted-foreground">{i + 1}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/admin/users/${row.user_id}`}
                      className="flex items-center gap-2 font-medium hover:underline"
                    >
                      <img src={row.avatar} alt="" className="size-6 rounded-full" />
                      {row.display_name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right font-semibold">{row.total}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant="success">{row.approved}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="warning">{row.returned}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="danger">{row.rejected}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline">{row.pitches}</Badge>
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {row.active_seconds > 0 ? formatDuration(row.active_seconds) : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}
