import { useEffect, useState } from 'react'
import { Link, router } from '@inertiajs/react'
import { ArrowRight, ClipboardCheck, Search } from 'lucide-react'
import { Badge } from '@/components/admin/ui/badge'
import { Button } from '@/components/admin/ui/button'
import { Input } from '@/components/admin/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/admin/ui/table'
import AdminPagination from '@/components/admin/AdminPagination'
import { cn } from '@/components/admin/lib/cn'
import { QueueStatCards, formatDuration, type QueueMetrics } from '@/components/admin/review/QueueStatCards'
import type { PagyProps, ProjectTier } from '@/types'

interface ReviewQueueRow {
  id: number
  name: string
  user_id: number
  user_display_name: string
  tier: ProjectTier
  is_build_review: boolean
  waiting_since_iso: string
  claimed_by: { name: string; avatar: string } | null
}

const FILTERS = [
  { key: '', label: 'All' },
  { key: 'design', label: 'Design' },
  { key: 'build', label: 'Build' },
]

function waitBadgeVariant(seconds: number, slaHours: number): 'outline' | 'warning' | 'destructive' {
  const hours = seconds / 3600
  if (hours >= slaHours) return 'destructive'
  if (hours >= slaHours / 2) return 'warning'
  return 'outline'
}

export default function AdminReviewsQueue({
  projects,
  pagy,
  query,
  filter,
  metrics,
  first_pending_id,
}: {
  projects: ReviewQueueRow[]
  pagy: PagyProps
  query: string
  filter: string
  metrics: QueueMetrics
  first_pending_id: number | null
}) {
  const [searchQuery, setSearchQuery] = useState(query)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000)
    return () => clearInterval(t)
  }, [])

  function submitSearch(e: React.FormEvent) {
    e.preventDefault()
    router.get('/admin/reviews', { query: searchQuery, filter: filter || undefined }, { preserveState: true })
  }

  function applyFilter(key: string) {
    router.get('/admin/reviews', { query: searchQuery || undefined, filter: key || undefined }, { preserveState: true })
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Review Queue</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Oldest submissions first. Open one to start a timed review session — keyboard shortcuts make it fast.
          </p>
        </div>
        {first_pending_id && (
          <Button asChild>
            <Link href={`/admin/reviews/${first_pending_id}`}>
              <ClipboardCheck className="size-4" />
              Start Reviewing
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        )}
      </div>

      <QueueStatCards metrics={metrics} />

      <div className="flex flex-col md:flex-row md:items-center gap-3 md:justify-between">
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map((f) => {
            const isActive = (filter || '') === f.key
            return (
              <button
                key={f.key}
                onClick={() => applyFilter(f.key)}
                className={cn(
                  'inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md border transition-colors cursor-pointer',
                  isActive
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground',
                )}
              >
                {f.label}
              </button>
            )
          })}
        </div>
        <form onSubmit={submitSearch} className="flex gap-2 items-center">
          <div className="relative">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Project or author"
              className="pl-9 w-64"
            />
          </div>
          <Button type="submit" variant="outline" size="sm">
            Search
          </Button>
        </form>
      </div>

      <div className="rounded-md border border-border bg-card overflow-hidden">
        {projects.length === 0 ? (
          <p className="text-sm text-muted-foreground py-12 text-center">Nothing pending — queue is clear. 🎉</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Waiting</TableHead>
                <TableHead>Claimed</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((p) => {
                const waitSeconds = Math.max(0, (now - Date.parse(p.waiting_since_iso)) / 1000)
                return (
                  <TableRow key={p.id} className="hover:bg-muted/20 transition-colors">
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>
                      <Link href={`/admin/users/${p.user_id}`} className="text-foreground hover:underline">
                        {p.user_display_name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {p.is_build_review ? (
                        <Badge className="bg-orange-500/15 text-orange-700 dark:text-orange-300 border border-orange-500/30">
                          Build
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground capitalize">{p.tier.replace('_', ' ')}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={waitBadgeVariant(waitSeconds, metrics.sla_hours)}>
                        {formatDuration(waitSeconds)}
                        {waitSeconds / 3600 >= metrics.sla_hours && ' overdue'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {p.claimed_by ? (
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <img src={p.claimed_by.avatar} alt="" className="size-4 rounded-full" />
                          {p.claimed_by.name}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground/50">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm" variant={p.claimed_by ? 'outline' : 'default'}>
                        <Link href={`/admin/reviews/${p.id}`}>
                          <ClipboardCheck className="size-3.5" />
                          {p.claimed_by ? 'Open' : 'Review'}
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {pagy && pagy.pages > 1 && <AdminPagination pagy={pagy} />}
    </div>
  )
}
