import { ExternalLink, GitFork } from 'lucide-react'
import type { SubprojectSummary } from '@/types'
import { statusBadge } from './helpers'

export function SubprojectsPanel({
  parent,
  subprojects,
}: {
  parent: SubprojectSummary | null
  subprojects: SubprojectSummary[]
}) {
  const rows = parent ? [parent] : subprojects
  if (rows.length === 0) return null

  return (
    <div className="rounded-md border border-border bg-card p-3 space-y-2">
      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <GitFork className="size-3.5" />
        {parent ? 'Subproject of' : `Subprojects (${subprojects.length})`}
      </div>
      {parent && (
        <p className="text-xs text-muted-foreground">
          This is its own project for review and payout. Its coins are topped up to the parent's tier once both are
          approved.
        </p>
      )}
      <ul className="space-y-1.5">
        {rows.map((row) => (
          <li key={row.id} className="flex items-center gap-2 flex-wrap text-sm">
            {statusBadge(row.status)}
            <a
              href={`/admin/projects/${row.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 truncate text-foreground hover:underline"
            >
              {row.name} <ExternalLink className="size-3" />
            </a>
            <span className="text-xs text-muted-foreground">{row.tier.replace('_', ' ')}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
