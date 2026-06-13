import { User as UserIcon } from 'lucide-react'
import { Badge } from '@/components/admin/ui/badge'
import { CollapsibleSection } from './CollapsibleSection'
import { formatSeconds } from '@/hooks/useReviewHeartbeat'
import type { SessionStats } from './types'

export function ReviewerTimeAudit({ sessionStats }: { sessionStats: SessionStats }) {
  return (
    <CollapsibleSection
      title="Reviewer time audit"
      summary={`${sessionStats.sessions.length} session${sessionStats.sessions.length === 1 ? '' : 's'} · ${formatSeconds(sessionStats.total_active_seconds)} total`}
      storageKey="audit"
      defaultOpen={false}
    >
      <div className="px-3 py-2 text-xs text-muted-foreground border-b border-border bg-muted/30">
        Active review time recorded per reviewer for this project — the basis for reviewer payouts. Visible to
        superadmins only.
      </div>
      <div className="divide-y divide-border">
        {sessionStats.sessions.map((s) => (
          <div key={s.id} className="px-3 py-2 text-xs flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <UserIcon className="size-3.5 text-muted-foreground" />
              <span className="font-medium">{s.reviewer_name}</span>
              <span className="text-muted-foreground">{s.started_at}</span>
              {s.ended_at && <span className="text-muted-foreground">→ {s.ended_at}</span>}
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono">{formatSeconds(s.active_seconds)}</span>
              {s.decision && <Badge variant="outline">{s.decision}</Badge>}
            </div>
          </div>
        ))}
      </div>
    </CollapsibleSection>
  )
}
