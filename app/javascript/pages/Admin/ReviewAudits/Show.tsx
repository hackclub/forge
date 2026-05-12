import { Link } from '@inertiajs/react'
import {
  ArrowLeft,
  Activity,
  Clock,
  CheckCircle2,
  Undo2,
  XCircle,
  RotateCcw,
  Send,
  Pencil,
  StickyNote,
  Info,
  type LucideIcon,
} from 'lucide-react'
import { Badge } from '@/components/admin/ui/badge'
import { Button } from '@/components/admin/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/admin/ui/card'
import { formatSeconds } from '@/hooks/useReviewHeartbeat'

interface SessionDetail {
  id: number
  reviewer: { id: number; name: string; email: string; avatar: string }
  project: { id: number; name: string; status: string }
  started_at: string
  ended_at: string | null
  last_heartbeat_at: string | null
  active_seconds: number
  heartbeats_count: number
  decision: string | null
  wall_clock_seconds: number
}

interface AuditEvent {
  id: number
  action: string
  metadata: Record<string, unknown> | null
  target_type: string | null
  target_id: number | null
  target_label: string | null
  created_at: string
  created_at_iso: string
}

const ACTION_ICON: Record<string, { icon: LucideIcon; color: string; label: string }> = {
  'project.approved': { icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', label: 'Approved' },
  'project.returned': { icon: Undo2, color: 'text-amber-600 dark:text-amber-400', label: 'Returned' },
  'project.rejected': { icon: XCircle, color: 'text-red-600 dark:text-red-400', label: 'Rejected' },
  'project.review_reversed': { icon: RotateCcw, color: 'text-orange-600 dark:text-orange-400', label: 'Review Reversed' },
  'project.review_notes_saved': { icon: Pencil, color: 'text-muted-foreground', label: 'Review notes saved' },
  'project.readme_refreshed': { icon: Send, color: 'text-muted-foreground', label: 'README refreshed' },
  'project.note_added': { icon: StickyNote, color: 'text-muted-foreground', label: 'Note added' },
  'project.note_destroyed': { icon: StickyNote, color: 'text-red-600 dark:text-red-400', label: 'Note deleted' },
}

function lookupAction(action: string) {
  return ACTION_ICON[action] || { icon: Info, color: 'text-muted-foreground', label: action }
}

function decisionBadge(decision: string | null) {
  if (!decision) return <Badge variant="warning">in progress</Badge>
  switch (decision) {
    case 'approved':
      return <Badge variant="success">approved</Badge>
    case 'returned':
      return <Badge variant="warning">returned</Badge>
    case 'rejected':
      return <Badge variant="destructive">rejected</Badge>
    default:
      return <Badge variant="secondary">{decision}</Badge>
  }
}

export default function ReviewAuditShow({
  session,
  events,
}: {
  session: SessionDetail
  events: AuditEvent[]
}) {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/admin/review_audits">
          <ArrowLeft className="size-4" />
          All sessions
        </Link>
      </Button>

      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Activity className="size-5" />
          <h1 className="text-2xl font-semibold tracking-tight">Session #{session.id}</h1>
          {decisionBadge(session.decision)}
        </div>
        <p className="text-sm text-muted-foreground">
          <Link href={`/admin/users/${session.reviewer.id}`} className="hover:underline text-foreground">
            {session.reviewer.name}
          </Link>{' '}
          reviewing{' '}
          <Link href={`/admin/projects/${session.project.id}`} className="hover:underline text-foreground">
            {session.project.name}
          </Link>{' '}
          · started {session.started_at}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Active time</p>
            <p className="text-xl font-semibold mt-1">{formatSeconds(session.active_seconds)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Wall clock</p>
            <p className="text-xl font-semibold mt-1">{formatSeconds(session.wall_clock_seconds)}</p>
          </CardContent>
        </Card>
        <Card title="Number of heartbeat pings (every ~20s while the tab is open and focused)">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Heartbeats</p>
            <p className="text-xl font-semibold mt-1 font-mono">{session.heartbeats_count}</p>
            {session.last_heartbeat_at && (
              <p className="text-[11px] text-muted-foreground mt-1">last {session.last_heartbeat_at}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Started</p>
            <p className="text-sm mt-1">{session.started_at}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Ended</p>
            <p className="text-sm mt-1">{session.ended_at || '—'}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="size-4" />
            Actions during this session
          </CardTitle>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No audited actions in this window. The reviewer opened the page but didn't perform a tracked action before the session ended.
            </p>
          ) : (
            <ol className="relative border-l border-border ml-3 space-y-4">
              {events.map((event) => {
                const cfg = lookupAction(event.action)
                const Icon = cfg.icon
                return (
                  <li key={event.id} className="ml-6">
                    <span className="absolute -left-2.5 flex items-center justify-center size-5 rounded-full bg-card border border-border">
                      <Icon className={`size-3 ${cfg.color}`} />
                    </span>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{cfg.label}</span>
                      <span className="text-xs text-muted-foreground font-mono">{event.action}</span>
                      <span className="text-xs text-muted-foreground">· {event.created_at}</span>
                    </div>
                    {event.metadata && Object.keys(event.metadata).length > 0 && (
                      <pre className="mt-2 text-[11px] font-mono whitespace-pre-wrap text-muted-foreground rounded-md border border-border bg-muted/30 p-2 max-h-60 overflow-auto">
                        {JSON.stringify(event.metadata, null, 2)}
                      </pre>
                    )}
                  </li>
                )
              })}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
