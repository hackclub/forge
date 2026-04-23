import { useMemo, useState } from 'react'
import { Head, Link } from '@inertiajs/react'

type SidebarNode = {
  type: 'folder' | 'page'
  title: string
  path: string
  children?: SidebarNode[]
}

function isNodeActive(node: SidebarNode, currentPath: string): boolean {
  if (node.path === currentPath) return true
  if (!node.children?.length) return false
  return node.children.some((child) => isNodeActive(child, currentPath))
}

function collectFolderPaths(nodes: SidebarNode[]): string[] {
  return nodes.flatMap((node) => {
    if (node.type !== 'folder') return []
    return [node.path, ...(node.children ? collectFolderPaths(node.children) : [])]
  })
}

function SidebarTree({
  nodes,
  currentPath,
  collapsedPaths,
  onToggleFolder,
  depth = 0,
}: {
  nodes: SidebarNode[]
  currentPath: string
  collapsedPaths: Set<string>
  onToggleFolder: (path: string) => void
  depth?: number
}) {
  return (
    <ul className={depth === 0 ? 'space-y-1' : 'mt-1 ml-4 space-y-1 border-l border-[#3a302b] pl-3'}>
      {nodes.map((node) => {
        const active = isNodeActive(node, currentPath)
        const isCurrent = node.path === currentPath

        if (node.type === 'folder') {
          const isCollapsed = collapsedPaths.has(node.path)
          return (
            <li key={`${node.type}:${node.path}`}>
              <button
                type="button"
                onClick={() => onToggleFolder(node.path)}
                className={`block w-full px-2 py-1 text-left text-[11px] uppercase tracking-[0.2em] font-bold ${
                  isCurrent ? 'text-[#ffb595]' : 'text-stone-500 hover:text-stone-300'
                }`}
              >
                <span className="mr-2 inline-block w-3 text-center">{isCollapsed ? '+' : '-'}</span>
                {node.title}
              </button>
              {!isCollapsed && node.children && node.children.length > 0 && (
                <SidebarTree
                  nodes={node.children}
                  currentPath={currentPath}
                  collapsedPaths={collapsedPaths}
                  onToggleFolder={onToggleFolder}
                  depth={depth + 1}
                />
              )}
            </li>
          )
        }

        return (
          <li key={`${node.type}:${node.path}`}>
            <Link
              href={node.path}
              className={`block px-2 py-1 text-sm transition-colors ${
                isCurrent
                  ? 'text-[#ffb595] bg-[#2a2a2a]'
                  : active
                    ? 'text-stone-200'
                    : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              {node.title}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

export default function MarkdownShow({
  content_html,
  page_title,
  sidebar_tree,
  current_path,
}: {
  content_html: string
  page_title: string
  sidebar_tree: SidebarNode[]
  current_path: string
}) {
  const [collapsedPaths, setCollapsedPaths] = useState<Set<string>>(() => new Set())
  const folderPaths = useMemo(() => collectFolderPaths(sidebar_tree), [sidebar_tree])

  const toggleFolder = (path: string) => {
    if (!folderPaths.includes(path)) return

    setCollapsedPaths((prev) => {
      const next = new Set(prev)
      if (next.has(path)) {
        next.delete(path)
      } else {
        next.add(path)
      }
      return next
    })
  }

  return (
    <>
      <Head title={`${page_title} - Forge`} />
      <div className="min-h-screen px-6 py-6 md:px-8 md:py-8">
        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start">
          <aside className="ghost-border bg-[#1c1b1b] lg:sticky lg:top-0 lg:h-[calc(100vh-3rem)]">
            <div className="flex h-full min-h-0 flex-col p-4">
              <div className="mb-3 text-[10px] uppercase tracking-[0.2em] font-bold text-stone-500">Resources</div>
              <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                <SidebarTree
                  nodes={sidebar_tree}
                  currentPath={current_path}
                  collapsedPaths={collapsedPaths}
                  onToggleFolder={toggleFolder}
                />
              </div>
            </div>
          </aside>

          <div className="ghost-border bg-[#1c1b1b] p-4 md:p-8">
            <div className="markdown-content" dangerouslySetInnerHTML={{ __html: content_html }} />
          </div>
        </div>
      </div>
    </>
  )
}
