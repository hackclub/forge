import { useState } from 'react'
import { router, Link } from '@inertiajs/react'
import { Search, ArrowRight, ClipboardCheck } from 'lucide-react'
import { Badge } from '@/components/admin/ui/badge'
import { Button } from '@/components/admin/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/admin/ui/card'
import { Input } from '@/components/admin/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/admin/ui/table'
import AdminPagination from '@/components/admin/AdminPagination'
import { cn } from '@/components/admin/lib/cn'
import type { AdminProjectRow, PagyProps, ProjectStatus, ProjectTier } from '@/types'

const statusConfig: Record<ProjectStatus, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' | 'success' | 'warning' }> = {
  draft: { label: 'Draft', variant: 'secondary' },
  pending: { label: 'Pending', variant: 'warning' },
  approved: { label: 'Approved', variant: 'success' },
  returned: { label: 'Returned', variant: 'warning' },
  rejected: { label: 'Rejected', variant: 'destructive' },
  pitch_approved: { label: 'Pitch Approved', variant: 'success' },
  pitch_pending: { label: 'Pitch Pending', variant: 'warning' },
}

const filters = [
  { key: '', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'pitch_approved', label: 'Pitch Approved' },
  { key: 'returned', label: 'Returned' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'draft', label: 'Draft' },
  { key: 'deleted', label: 'Deleted' },
]

type Sort = 'recent' | 'tier'

const sortOptions: { key: Sort; label: string }[] = [
  { key: 'recent', label: 'Recent' },
  { key: 'tier', label: 'Tier' },
]

const TIER_LABELS: Record<ProjectTier, string> = {
  tier_1: 'Tier 1',
  tier_2: 'Tier 2',
  tier_3: 'Tier 3',
  tier_4: 'Tier 4',
  tier_build_review: 'Build Review',
}

export default function AdminProjectsIndex({
  projects,
  pagy,
  query,
  sort = 'recent',
  status_filter,
  counts,
  page_title,
  hide_filters,
  review_mode,
  first_pending_id,
}: {
  projects: AdminProjectRow[]
  pagy: PagyProps
  query: string
  sort?: Sort
  status_filter: string
  counts: Record<string, number>
  page_title?: string
  hide_filters?: boolean
  review_mode?: boolean
  first_pending_id?: number | null
}) {
  const [searchQuery, setSearchQuery] = useState(query)
  const basePath = typeof window !== 'undefined' ? window.location.pathname : '/admin/projects'

  function search(e: React.FormEvent) {
    e.preventDefault()
    router.get(basePath, { query: searchQuery, status: hide_filters ? undefined : status_filter, sort }, { preserveState: true })
  }

  function filterByStatus(status: string) {
    router.get('/admin/projects', { query: searchQuery, status, sort }, { preserveState: true })
  }

  function sortBy(nextSort: Sort) {
    router.get('/admin/projects', { query: searchQuery, status: status_filter, sort: nextSort }, { preserveState: true })
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{page_title || 'All Projects'}</h1>
          {review_mode && (
            <p className="text-sm text-muted-foreground mt-1">
              Click <span className="text-foreground">Start Review Session</span> on the oldest pending project to begin. A timer tracks your active review time.
            </p>
          )}
        </div>
        <div className="flex gap-2 items-center">
          <form onSubmit={search} className="flex gap-2 items-center">
            <div className="relative">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ID, title, or author"
                className="pl-9 w-64"
              />
            </div>
            <Button type="submit" variant="outline" size="sm">
              Search
            </Button>
          </form>
          {review_mode && first_pending_id && (
            <Button asChild>
              <Link href={`/admin/reviews/${first_pending_id}`}>
                <ClipboardCheck className="size-4" />
                Start Reviewing
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          )}
        </div>
      </div>

      {!hide_filters && (
        <div className="flex gap-2 flex-wrap">
          {filters.map((f) => {
            const count = f.key ? counts[f.key] || 0 : counts.all || 0
            const isActive = status_filter === f.key
            return (
              <button
                key={f.key}
                onClick={() => filterByStatus(f.key)}
                className={cn(
                  'inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md border transition-colors cursor-pointer',
                  isActive
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground',
                )}
              >
                {f.label}
                <span className={cn('text-[10px]', isActive ? 'opacity-70' : 'text-muted-foreground')}>{count}</span>
              </button>
            )
          })}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">Sort</span>
        {sortOptions.map((option) => {
          const isActive = sort === option.key
          return (
            <button
              key={option.key}
              type="button"
              onClick={() => sortBy(option.key)}
              className={cn(
                'inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md border transition-colors cursor-pointer',
                isActive
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground',
              )}
            >
              {option.label}
            </button>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{projects.length} project{projects.length === 1 ? '' : 's'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {projects.length === 0 ? (
            <p className="text-sm text-muted-foreground py-10 text-center">
              {status_filter ? `No ${status_filter} projects.` : 'No projects yet.'}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-14">ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Ships</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((project) => {
                  const sc = statusConfig[project.status] || statusConfig.draft
                  return (
                    <TableRow key={project.id} className={project.is_discarded ? 'opacity-50' : ''}>
                      <TableCell className="text-muted-foreground text-sm">{project.id}</TableCell>
                      <TableCell className="font-medium">
                        {project.name}
                        {project.is_discarded && (
                          <Badge variant="destructive" className="ml-2">
                            Deleted
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Link href={`/admin/users/${project.user_id}`} className="text-foreground hover:underline">
                          {project.user_display_name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant={sc.variant}>{sc.label}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">{TIER_LABELS[project.tier]}</TableCell>
                      <TableCell className="font-mono text-sm">{project.ships_count}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{project.created_at}</TableCell>
                      <TableCell className="text-right">
                        {review_mode ? (
                          <Button asChild size="sm">
                            <Link href={`/admin/reviews/${project.id}`}>
                              <ClipboardCheck className="size-3.5" />
                              Start Review
                            </Link>
                          </Button>
                        ) : (
                          <Button asChild variant="ghost" size="sm">
                            <Link href={`/admin/projects/${project.id}`}>View</Link>
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
          {pagy && pagy.pages > 1 && <AdminPagination pagy={pagy} />}
        </CardContent>
      </Card>
    </div>
  )
}
