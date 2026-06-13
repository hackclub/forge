import { useCallback, useEffect, useState } from 'react'
import { ExternalLink, GitBranch, Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/admin/ui/button'
import { cn } from '@/components/admin/lib/cn'

interface ChangeFile {
  filename: string
  status: string
  additions: number
  deletions: number
}

interface ChangeCommit {
  sha: string
  message: string
  author: string | null
}

interface ChangesResponse {
  available: boolean
  reason?: string
  message?: string
  base_sha?: string
  head_sha?: string
  ahead_by?: number
  total_commits?: number
  html_url?: string | null
  files?: ChangeFile[]
  commits?: ChangeCommit[]
}

const REASON_TEXT: Record<string, string> = {
  no_repo: 'No repository linked.',
  unsupported_host: 'Changes view is only available for GitHub repositories.',
  no_baseline: 'No earlier review to compare against yet — this is the first time it has been reviewed.',
}

function statusColor(status: string): string {
  switch (status) {
    case 'added':
      return 'text-emerald-600 dark:text-emerald-400'
    case 'removed':
      return 'text-red-600 dark:text-red-400'
    case 'renamed':
      return 'text-sky-600 dark:text-sky-400'
    default:
      return 'text-amber-600 dark:text-amber-400'
  }
}

export function ChangesSinceReview({ projectId }: { projectId: number }) {
  const [data, setData] = useState<ChangesResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState(false)

  const load = useCallback(
    (refresh = false) => {
      setLoading(true)
      setFailed(false)
      fetch(`/admin/projects/${projectId}/changes_since_review${refresh ? '?refresh=1' : ''}`, {
        credentials: 'same-origin',
        headers: { Accept: 'application/json' },
      })
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error('request failed'))))
        .then((d: ChangesResponse) => setData(d))
        .catch(() => setFailed(true))
        .finally(() => setLoading(false))
    },
    [projectId],
  )

  useEffect(() => {
    load()
  }, [load])

  if (loading && !data) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground p-3">
        <Loader2 className="size-4 animate-spin" />
        Comparing against the last review…
      </div>
    )
  }
  if (failed || !data || (data.available === false && data.reason === 'error')) {
    return (
      <div className="p-3 space-y-2">
        <p className="text-sm text-muted-foreground">
          {data?.message || "Couldn't load changes since the last review."}
        </p>
        <Button variant="outline" size="sm" onClick={() => load(true)}>
          <RefreshCw className="size-3.5" />
          Retry
        </Button>
      </div>
    )
  }
  if (!data.available) {
    return (
      <p className="text-sm text-muted-foreground p-3">
        {REASON_TEXT[data.reason ?? ''] || 'No comparison available.'}
      </p>
    )
  }
  if ((data.total_commits ?? 0) === 0) {
    return <p className="text-sm text-muted-foreground p-3">No new commits since the last review.</p>
  }

  const files = data.files ?? []
  const commits = data.commits ?? []
  return (
    <div className="rounded-md border border-border bg-card">
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border bg-muted/50">
        <span className="text-xs text-muted-foreground">
          {data.total_commits} commit{data.total_commits === 1 ? '' : 's'} · {files.length} file
          {files.length === 1 ? '' : 's'} changed since last review
        </span>
        <div className="flex items-center gap-2 shrink-0">
          {data.html_url && (
            <a
              href={data.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-foreground hover:underline"
            >
              GitHub <ExternalLink className="size-3" />
            </a>
          )}
          <Button variant="ghost" size="sm" onClick={() => load(true)} disabled={loading}>
            <RefreshCw className={cn('size-3.5', loading && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </div>

      {commits.length > 0 && (
        <ul className="divide-y divide-border border-b border-border">
          {commits.map((c) => (
            <li key={c.sha} className="flex items-center gap-2 px-3 py-1.5 text-xs">
              <GitBranch className="size-3 shrink-0 text-muted-foreground" />
              <span className="font-mono text-muted-foreground shrink-0">{c.sha}</span>
              <span className="truncate">{c.message}</span>
              {c.author && <span className="text-muted-foreground shrink-0 ml-auto">{c.author}</span>}
            </li>
          ))}
        </ul>
      )}

      <ul className="p-1.5 font-mono max-h-[50vh] overflow-y-auto">
        {files.map((f) => (
          <li key={f.filename} className="flex items-center gap-2 px-1.5 py-0.5 text-sm">
            <span className={cn('uppercase text-[10px] font-bold w-14 shrink-0', statusColor(f.status))}>
              {f.status}
            </span>
            <span className="truncate flex-1">{f.filename}</span>
            <span className="text-emerald-600 dark:text-emerald-400 shrink-0">+{f.additions}</span>
            <span className="text-red-600 dark:text-red-400 shrink-0">-{f.deletions}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
