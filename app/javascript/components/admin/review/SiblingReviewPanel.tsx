import { ArrowRightLeft, ExternalLink } from 'lucide-react'
import { statusBadge } from './helpers'
import type { SiblingReview } from './types'

export function SiblingReviewPanel({ sibling }: { sibling: SiblingReview }) {
  const href = sibling.pending ? `/admin/reviews/${sibling.id}` : `/admin/projects/${sibling.id}`
  return (
    <div className="rounded-md border border-border bg-card p-3 space-y-2">
      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <ArrowRightLeft className="size-3.5" />
        {sibling.kind === 'design' ? 'Design review' : 'Build review'}
      </div>
      <div className="flex items-center gap-2 flex-wrap text-sm">
        {statusBadge(sibling.status)}
        <span className="truncate">{sibling.name}</span>
      </div>
      {sibling.reviewer_name && (
        <p className="text-xs text-muted-foreground">
          {sibling.reviewer_name}
          {sibling.reviewed_at ? ` · ${sibling.reviewed_at}` : ''}
        </p>
      )}
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-xs text-foreground hover:underline"
      >
        Open {sibling.kind} review <ExternalLink className="size-3" />
      </a>
    </div>
  )
}
