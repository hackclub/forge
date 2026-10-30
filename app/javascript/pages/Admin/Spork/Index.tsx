import { useEffect, useRef, useState } from 'react'
import { Link, router } from '@inertiajs/react'
import { AlertTriangle, Loader2, Play, Search, ScanSearch } from 'lucide-react'
import { Badge } from '@/components/admin/ui/badge'
import { Button } from '@/components/admin/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/admin/ui/card'
import { Input } from '@/components/admin/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/admin/ui/table'
import AdminPagination from '@/components/admin/AdminPagination'
import {
  SporkCheckDetails,
  SporkMatchLink,
  SporkVerdictBadge,
  type SporkCheckDetail,
  type SporkMatch,
  type SporkVerdict,
} from '@/components/admin/SporkCard'
import { cn } from '@/components/admin/lib/cn'
import type { PagyProps } from '@/types'

interface SporkRow {
  id: number
  name: string
  status: string
  repo_link: string | null
  user_display_name: string | null
  spork: {
    verdict: SporkVerdict
    match_count: number
    top_matches: (SporkMatch & { mode: string })[]
    error_message: string | null
    checked_at: string | null
  } | null
}

interface SporkStats {
  screenable: number
  screened: number
  exclusive: number
  shared: number
  failed: number
  last_checked_at: string | null
}

type LookupState =
  | { status: 'idle' }
  | { status: 'pending'; repo: string }
  | { status: 'error'; repo?: string; message: string }
  | ({ status: 'done'; repo: string } & SporkCheckDetail)

const filters = [
  { key: 'hits', label: 'Hits' },
  { key: 'exclusive', label: 'Likely copied' },
  { key: 'failed', label: 'Failed' },
  { key: 'unscreened', label: 'Unscreened' },
  { key: 'all', label: 'All' },
]

function csrfToken(): string {
  return document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content || ''
}

export default function AdminSporkIndex({
  projects,
  pagy,
  query,
  filter,
  stats,
  enabled,
}: {
  projects: SporkRow[]
  pagy: PagyProps
  query: string
  filter: string
  stats: SporkStats
  enabled: boolean
}) {
  const [searchQuery, setSearchQuery] = useState(query)
  const [repoInput, setRepoInput] = useState('')
  const [lookup, setLookup] = useState<LookupState>({ status: 'idle' })
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (pollRef.current) clearTimeout(pollRef.current)
    },
    [],
  )

  function search(e: React.FormEvent) {
    e.preventDefault()
    router.get('/admin/spork', { query: searchQuery, filter: searchQuery ? 'all' : filter }, { preserveState: true })
  }

  function filterBy(key: string) {
    router.get('/admin/spork', { query: searchQuery, filter: key }, { preserveState: true })
  }

  function sweep() {
    if (!confirm(`Screen all ${stats.screenable} projects with a GitHub repo? This runs in the background.`)) return
    router.post('/admin/spork/sweep')
  }

  function screen(projectId: number) {
    router.post(`/admin/spork/screen/${projectId}`, {}, { preserveScroll: true })
  }

  function poll(token: string, repo: string) {
    pollRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/admin/spork/lookup/${token}`, { headers: { Accept: 'application/json' } })
        const data = await res.json()
        if (data.status === 'pending') {
          poll(token, repo)
        } else {
          setLookup(data)
        }
      } catch {
        setLookup({ status: 'error', repo, message: 'Lost connection while waiting for Spork.' })
      }
    }, 2000)
  }

  async function runLookup(e: React.FormEvent) {
    e.preventDefault()
    const repo = repoInput.trim()
    if (!repo || lookup.status === 'pending') return
    if (pollRef.current) clearTimeout(pollRef.current)
    setLookup({ status: 'pending', repo })
    try {
      const res = await fetch('/admin/spork/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-CSRF-Token': csrfToken() },
        body: JSON.stringify({ repo }),
      })
      const data = await res.json()
      if (!res.ok) {
        setLookup({ status: 'error', repo, message: data.error || 'Lookup failed.' })
        return
      }
      poll(data.token, repo)
    } catch {
      setLookup({ status: 'error', repo, message: 'Lookup failed.' })
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <ScanSearch className="size-5" />
            Spork
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Every project's repo screened against public KiCad and STEP designs. Sweeps run nightly.
          </p>
        </div>
        <Button variant="outline" onClick={sweep} disabled={!enabled}>
          <Play className="size-4" />
          Run sweep
        </Button>
      </div>

      {!enabled && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="p-3 text-sm text-destructive flex items-start gap-2">
            <AlertTriangle className="size-4 shrink-0 mt-0.5" />
            <span>
              Spork is not configured. Add a key under API Keys or set <code>HACKATIME_ADMIN_API_KEY</code>.
            </span>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Screened</p>
            <p className="text-2xl font-semibold mt-1">
              {stats.screened}
              <span className="text-sm text-muted-foreground font-normal"> / {stats.screenable}</span>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Likely copied</p>
            <p className="text-2xl font-semibold mt-1 text-red-600 dark:text-red-400">{stats.exclusive}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Shared template</p>
            <p className="text-2xl font-semibold mt-1 text-amber-600 dark:text-amber-400">{stats.shared}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Last checked</p>
            <p className="text-sm font-medium mt-2">{stats.last_checked_at || '—'}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Spork lookup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={runLookup} className="flex gap-2">
            <Input
              value={repoInput}
              onChange={(e) => setRepoInput(e.target.value)}
              placeholder="owner/repo or https://github.com/owner/repo"
              className="font-mono"
            />
            <Button type="submit" disabled={!enabled || lookup.status === 'pending' || !repoInput.trim()}>
              {lookup.status === 'pending' ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Search className="size-4" />
              )}
              Screen
            </Button>
          </form>
          {lookup.status === 'pending' && (
            <p className="text-xs text-muted-foreground">Screening {lookup.repo}. Large repos can take a minute.</p>
          )}
          {lookup.status === 'error' && <p className="text-xs text-destructive">{lookup.message}</p>}
          {lookup.status === 'done' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm">{lookup.repo}</span>
                <SporkVerdictBadge verdict={lookup.verdict} />
              </div>
              <SporkCheckDetails check={lookup} />
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex gap-2 flex-wrap">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => filterBy(f.key)}
              className={cn(
                'inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md border transition-colors cursor-pointer',
                filter === f.key
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <form onSubmit={search} className="flex gap-2 items-center">
          <div className="relative">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Project name or repo"
              className="pl-9 w-64"
            />
          </div>
          <Button type="submit" variant="outline" size="sm">
            Search
          </Button>
        </form>
      </div>

      <Card>
        <CardContent className="p-0">
          {projects.length === 0 ? (
            <p className="text-sm text-muted-foreground py-10 text-center">No projects match.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Spork</TableHead>
                  <TableHead>Top matches</TableHead>
                  <TableHead>Checked</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="max-w-xs">
                      <Link href={`/admin/projects/${p.id}`} className="font-medium hover:underline">
                        {p.name}
                      </Link>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Badge variant="outline" className="text-[10px]">
                          {p.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground truncate">{p.user_display_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <SporkVerdictBadge verdict={p.spork?.verdict} />
                        {p.spork?.error_message && (
                          <p className="text-[11px] text-muted-foreground max-w-48 truncate">{p.spork.error_message}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 max-w-sm">
                        {p.spork?.top_matches.map((m) => (
                          <SporkMatchLink key={`${m.mode}-${m.repo}`} match={m} />
                        ))}
                        {p.spork && p.spork.match_count > p.spork.top_matches.length && (
                          <span className="text-[11px] text-muted-foreground">
                            +{p.spork.match_count - p.spork.top_matches.length} more
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">{p.spork?.checked_at || '—'}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => screen(p.id)} disabled={!enabled}>
                        Screen
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AdminPagination pagy={pagy} />
    </div>
  )
}
