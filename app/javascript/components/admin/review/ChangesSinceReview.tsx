import { useCallback, useEffect, useState } from 'react'
import { ChevronDown, ChevronRight, ExternalLink, Folder, FolderOpen, Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/admin/ui/button'
import { cn } from '@/components/admin/lib/cn'

interface FileChange {
  filename: string
  status: string
  additions: number
  deletions: number
  patch: string | null
}

interface ChangesResponse {
  available: boolean
  reason?: string
  message?: string
  since?: string | null
  total_commits?: number
  html_url?: string | null
  files?: FileChange[]
}

interface TreeNode {
  name: string
  path: string
  file: FileChange | null
  children: Map<string, TreeNode>
}

const REASON_TEXT: Record<string, string> = {
  no_repo: 'No repository linked.',
  unsupported_host: 'Changes view is only available for GitHub repositories.',
  no_baseline: 'No earlier review to compare against yet — this is the first time it has been reviewed.',
}

function statusGlyph(status: string): { symbol: string; color: string; strike: boolean } {
  switch (status) {
    case 'added':
      return { symbol: '+', color: 'text-emerald-600 dark:text-emerald-400', strike: false }
    case 'removed':
      return { symbol: '−', color: 'text-red-600 dark:text-red-400', strike: true }
    case 'renamed':
    case 'copied':
      return { symbol: '→', color: 'text-sky-600 dark:text-sky-400', strike: false }
    default:
      return { symbol: '~', color: 'text-amber-600 dark:text-amber-400', strike: false }
  }
}

function buildTree(files: FileChange[]): TreeNode {
  const root: TreeNode = { name: '', path: '', file: null, children: new Map() }
  for (const f of files) {
    const parts = f.filename.split('/')
    let node = root
    parts.forEach((part, i) => {
      let child = node.children.get(part)
      if (!child) {
        child = { name: part, path: parts.slice(0, i + 1).join('/'), file: null, children: new Map() }
        node.children.set(part, child)
      }
      if (i === parts.length - 1) child.file = f
      node = child
    })
  }
  return root
}

function sortedChildren(node: TreeNode): TreeNode[] {
  return [...node.children.values()].sort((a, b) => {
    const aFolder = a.children.size > 0
    const bFolder = b.children.size > 0
    if (aFolder !== bFolder) return aFolder ? -1 : 1
    return a.name.localeCompare(b.name)
  })
}

function patchLineColor(line: string): string {
  if (line.startsWith('@@')) return 'text-sky-600 dark:text-sky-400'
  if (line.startsWith('+') && !line.startsWith('+++')) return 'text-emerald-600 dark:text-emerald-400'
  if (line.startsWith('-') && !line.startsWith('---')) return 'text-red-600 dark:text-red-400'
  return 'text-foreground/70'
}

function DiffPatch({ patch }: { patch: string | null }) {
  if (!patch) {
    return <p className="px-3 py-2 text-xs text-muted-foreground">No inline diff (binary or too large).</p>
  }
  return (
    <pre className="text-[11px] leading-relaxed font-mono overflow-x-auto border-t border-border bg-background py-1">
      {patch.split('\n').map((line, i) => (
        <div key={i} className={cn('px-3 whitespace-pre', patchLineColor(line))}>
          {line || ' '}
        </div>
      ))}
    </pre>
  )
}

function TreeRow({ node, depth }: { node: TreeNode; depth: number }) {
  const isFolder = node.children.size > 0
  const [open, setOpen] = useState(true)
  const [diffOpen, setDiffOpen] = useState(false)

  if (isFolder) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="w-full flex items-center gap-1.5 py-0.5 text-sm hover:bg-muted/30 cursor-pointer text-left"
          style={{ paddingLeft: depth * 14 + 4 }}
        >
          <ChevronRight
            className={cn('size-3.5 shrink-0 text-muted-foreground transition-transform', open && 'rotate-90')}
          />
          {open ? (
            <FolderOpen className="size-3.5 text-sky-500 shrink-0" />
          ) : (
            <Folder className="size-3.5 text-sky-500 shrink-0" />
          )}
          <span className="truncate font-medium">{node.name}</span>
        </button>
        {open && sortedChildren(node).map((c) => <TreeRow key={c.path} node={c} depth={depth + 1} />)}
      </div>
    )
  }

  const f = node.file
  if (!f) return null
  const g = statusGlyph(f.status)
  return (
    <div>
      <button
        type="button"
        onClick={() => setDiffOpen((o) => !o)}
        className="w-full flex items-center gap-1.5 py-0.5 text-sm hover:bg-muted/30 cursor-pointer text-left"
        style={{ paddingLeft: depth * 14 + 8 }}
      >
        <span className={cn('w-3 text-center font-bold shrink-0', g.color)}>{g.symbol}</span>
        <span className={cn('truncate flex-1', g.strike && 'line-through text-muted-foreground')}>{node.name}</span>
        <span className="text-emerald-600 dark:text-emerald-400 text-xs shrink-0">+{f.additions}</span>
        <span className="text-red-600 dark:text-red-400 text-xs shrink-0">−{f.deletions}</span>
        <ChevronDown
          className={cn('size-3.5 shrink-0 text-muted-foreground transition-transform', !diffOpen && '-rotate-90')}
        />
      </button>
      {diffOpen && <DiffPatch patch={f.patch} />}
    </div>
  )
}

export function ChangesSinceReview({ projectId }: { projectId: number }) {
  const [data, setData] = useState<ChangesResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

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
  const counts = { added: 0, modified: 0, removed: 0, renamed: 0 }
  for (const f of files) {
    if (f.status === 'added') counts.added++
    else if (f.status === 'removed') counts.removed++
    else if (f.status === 'renamed' || f.status === 'copied') counts.renamed++
    else counts.modified++
  }
  const root = buildTree(files)

  return (
    <div className="rounded-md border border-border bg-card">
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border bg-muted/50">
        <div className="flex items-center gap-2 text-sm min-w-0 flex-wrap">
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="text-muted-foreground hover:text-foreground cursor-pointer"
            aria-label={collapsed ? 'Expand' : 'Collapse'}
          >
            <ChevronDown className={cn('size-4 transition-transform', collapsed && '-rotate-90')} />
          </button>
          <span className="font-semibold">Changes Since Last Review</span>
          <span className="text-xs text-muted-foreground">
            · {data.total_commits} commit{data.total_commits === 1 ? '' : 's'}
          </span>
          {counts.added > 0 && (
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">+{counts.added}</span>
          )}
          {counts.modified > 0 && (
            <span className="text-xs font-medium text-amber-600 dark:text-amber-400">~{counts.modified}</span>
          )}
          {counts.removed > 0 && (
            <span className="text-xs font-medium text-red-600 dark:text-red-400">−{counts.removed}</span>
          )}
          {counts.renamed > 0 && (
            <span className="text-xs font-medium text-sky-600 dark:text-sky-400">→{counts.renamed}</span>
          )}
          {data.since && <span className="text-xs text-muted-foreground">since {data.since}</span>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {data.html_url && (
            <Button asChild size="sm">
              <a href={data.html_url} target="_blank" rel="noopener noreferrer">
                GitHub Diff
                <ExternalLink className="size-3.5" />
              </a>
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={() => load(true)} disabled={loading} aria-label="Refresh">
            <RefreshCw className={cn('size-3.5', loading && 'animate-spin')} />
          </Button>
        </div>
      </div>
      {!collapsed && (
        <div className="p-1.5 max-h-[60vh] overflow-y-auto">
          {sortedChildren(root).map((c) => (
            <TreeRow key={c.path} node={c} depth={0} />
          ))}
        </div>
      )}
    </div>
  )
}
