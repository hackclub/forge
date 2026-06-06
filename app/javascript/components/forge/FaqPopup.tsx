import { useEffect, useMemo, useRef, useState } from 'react'
import { router, usePage } from '@inertiajs/react'
import { ForgeLoading } from './useForgeData'

type SidebarNode = {
  type: 'folder' | 'page'
  title: string
  path: string
  children?: SidebarNode[]
}

interface DocsData {
  content_html: string
  page_title: string
  sidebar_tree: SidebarNode[]
  current_path: string
}

function pathToSlug(path: string): string {
  if (path === '/docs' || path === '/docs/') return 'index'
  return path.replace(/^\/docs\//, '').replace(/\/$/, '')
}

function isNodeActive(node: SidebarNode, currentPath: string): boolean {
  if (node.path === currentPath) return true
  return node.children?.some((c) => isNodeActive(c, currentPath)) ?? false
}

function collectFolderPaths(nodes: SidebarNode[]): string[] {
  return nodes.flatMap((node) =>
    node.type === 'folder' ? [node.path, ...(node.children ? collectFolderPaths(node.children) : [])] : [],
  )
}

function DocsSidebar({
  nodes,
  currentPath,
  collapsed,
  onToggle,
  onSelect,
  depth = 0,
}: {
  nodes: SidebarNode[]
  currentPath: string
  collapsed: Set<string>
  onToggle: (path: string) => void
  onSelect: (path: string) => void
  depth?: number
}) {
  return (
    <ul className={depth === 0 ? 'space-y-1' : 'ml-4 mt-1 space-y-1 border-l border-[#3a302b] pl-3'}>
      {nodes.map((node) => {
        const active = isNodeActive(node, currentPath)
        const isCurrent = node.path === currentPath

        if (node.type === 'folder') {
          const isCollapsed = collapsed.has(node.path)
          return (
            <li key={`folder:${node.path}`}>
              <button
                type="button"
                onClick={() => onToggle(node.path)}
                className={`block w-full px-2 py-1 text-left text-[11px] font-bold uppercase tracking-[0.2em] ${
                  isCurrent ? 'text-[#ffb595]' : 'text-stone-500 hover:text-stone-300'
                }`}
              >
                <span className="mr-2 inline-block w-3 text-center">{isCollapsed ? '+' : '-'}</span>
                {node.title}
              </button>
              {!isCollapsed && node.children && node.children.length > 0 && (
                <DocsSidebar
                  nodes={node.children}
                  currentPath={currentPath}
                  collapsed={collapsed}
                  onToggle={onToggle}
                  onSelect={onSelect}
                  depth={depth + 1}
                />
              )}
            </li>
          )
        }

        return (
          <li key={`page:${node.path}`}>
            <button
              type="button"
              onClick={() => onSelect(node.path)}
              className={`block w-full px-2 py-1 text-left text-sm transition-colors ${
                isCurrent
                  ? 'bg-[#2a2a2a] text-[#ffb595]'
                  : active
                    ? 'text-stone-200'
                    : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              {node.title}
            </button>
          </li>
        )
      })}
    </ul>
  )
}

export default function FaqPopup() {
  const live = (usePage().props as Record<string, unknown>).docs as DocsData | undefined
  const [cached, setCached] = useState<DocsData | null>(live ?? null)
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set())
  const requested = useRef(false)

  useEffect(() => {
    if (live === undefined && !requested.current) {
      requested.current = true
      router.reload({ only: ['docs'] })
    }
  }, [live])

  useEffect(() => {
    if (live !== undefined) setCached(live)
  }, [live])

  const folderPaths = useMemo(() => (cached ? collectFolderPaths(cached.sidebar_tree) : []), [cached])

  if (!cached) return <ForgeLoading />
  const data = cached

  function loadDoc(path: string) {
    router.reload({ only: ['docs'], data: { doc: pathToSlug(path) } })
  }

  function toggleFolder(path: string) {
    if (!folderPaths.includes(path)) return
    setCollapsed((prev) => {
      const next = new Set(prev)
      next.has(path) ? next.delete(path) : next.add(path)
      return next
    })
  }

  function onContentClick(e: React.MouseEvent) {
    const anchor = (e.target as HTMLElement).closest('a')
    if (!anchor) return
    const href = anchor.getAttribute('href') || ''
    if (href.startsWith('/docs')) {
      e.preventDefault()
      loadDoc(href.split('#')[0].split('?')[0])
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[200px_minmax(0,1fr)]">
      <aside className="lg:max-h-[70vh] lg:overflow-y-auto lg:pr-1">
        <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">Resources</div>
        <DocsSidebar
          nodes={data.sidebar_tree}
          currentPath={data.current_path}
          collapsed={collapsed}
          onToggle={toggleFolder}
          onSelect={loadDoc}
        />
      </aside>

      <div
        className="markdown-content min-w-0"
        onClick={onContentClick}
        dangerouslySetInnerHTML={{ __html: data.content_html }}
      />
    </div>
  )
}
