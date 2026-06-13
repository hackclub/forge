import { useCallback, useEffect, useState } from 'react'
import { ChevronRight, File as FileIcon, Folder, FolderOpen, Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/admin/ui/button'
import { cn } from '@/components/admin/lib/cn'

interface TreeNode {
  name: string
  path: string
  isFile: boolean
  children: Map<string, TreeNode>
}

interface RepoTreeResponse {
  paths: string[]
  fetched_at: string | null
  source: string | null
  blob_base: string | null
  error: string | null
}

function buildTree(paths: string[]): TreeNode {
  const root: TreeNode = { name: '', path: '', isFile: false, children: new Map() }
  for (const p of paths) {
    const parts = p.split('/')
    let node = root
    parts.forEach((part, i) => {
      const isFile = i === parts.length - 1
      let child = node.children.get(part)
      if (!child) {
        child = { name: part, path: parts.slice(0, i + 1).join('/'), isFile, children: new Map() }
        node.children.set(part, child)
      }
      node = child
    })
  }
  return root
}

function sortedChildren(node: TreeNode): TreeNode[] {
  return [...node.children.values()].sort((a, b) => {
    if (a.isFile !== b.isFile) return a.isFile ? 1 : -1
    return a.name.localeCompare(b.name)
  })
}

function TreeRow({ node, depth, blobBase }: { node: TreeNode; depth: number; blobBase: string | null }) {
  const [open, setOpen] = useState(depth < 1)

  if (node.isFile) {
    const inner = (
      <span className="flex items-center gap-1.5 py-0.5 text-sm" style={{ paddingLeft: depth * 14 + 8 }}>
        <FileIcon className="size-3.5 text-muted-foreground shrink-0" />
        <span className="truncate">{node.name}</span>
      </span>
    )
    return blobBase ? (
      <a
        href={`${blobBase}${node.path}`}
        target="_blank"
        rel="noopener noreferrer"
        className="block hover:bg-muted/30 hover:underline"
      >
        {inner}
      </a>
    ) : (
      <div className="block">{inner}</div>
    )
  }

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
      {open &&
        sortedChildren(node).map((child) => (
          <TreeRow key={child.path} node={child} depth={depth + 1} blobBase={blobBase} />
        ))}
    </div>
  )
}

export function RepoTree({ projectId, hasRepo }: { projectId: number; hasRepo: boolean }) {
  const [data, setData] = useState<RepoTreeResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState(false)

  const load = useCallback(
    (refresh = false) => {
      setLoading(true)
      setFailed(false)
      fetch(`/admin/projects/${projectId}/repo_tree${refresh ? '?refresh=1' : ''}`, {
        credentials: 'same-origin',
        headers: { Accept: 'application/json' },
      })
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error('request failed'))))
        .then((d: RepoTreeResponse) => setData(d))
        .catch(() => setFailed(true))
        .finally(() => setLoading(false))
    },
    [projectId],
  )

  useEffect(() => {
    if (hasRepo) load()
  }, [hasRepo, load])

  if (!hasRepo) {
    return <p className="text-sm text-muted-foreground p-3">No repository linked.</p>
  }
  if (loading && !data) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground p-3">
        <Loader2 className="size-4 animate-spin" />
        Loading repository tree…
      </div>
    )
  }
  if (failed || !data || data.error) {
    return (
      <div className="p-3 space-y-2">
        <p className="text-sm text-muted-foreground">{data?.error || "Couldn't load the repository tree."}</p>
        <Button variant="outline" size="sm" onClick={() => load(true)}>
          <RefreshCw className="size-3.5" />
          Retry
        </Button>
      </div>
    )
  }
  if (data.paths.length === 0) {
    return (
      <p className="text-sm text-muted-foreground p-3">
        No files found{data.source ? '' : ' (unsupported repository host)'}.
      </p>
    )
  }

  const root = buildTree(data.paths)
  return (
    <div className="rounded-md border border-border bg-card">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/50">
        <span className="text-xs text-muted-foreground">
          {data.paths.length} files{data.source ? ` · ${data.source}` : ''}
        </span>
        <Button variant="ghost" size="sm" onClick={() => load(true)} disabled={loading}>
          <RefreshCw className={cn('size-3.5', loading && 'animate-spin')} />
          Refresh
        </Button>
      </div>
      <div className="p-1.5 max-h-[60vh] overflow-y-auto font-mono">
        {sortedChildren(root).map((child) => (
          <TreeRow key={child.path} node={child} depth={0} blobBase={data.blob_base} />
        ))}
      </div>
    </div>
  )
}
