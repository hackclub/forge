import { useState } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  CheckCircle2,
  ShieldCheck,
  Undo2,
  XCircle,
  FileEdit,
  History,
  ChevronDown,
  ChevronUp,
  Info,
  Send,
  RotateCcw,
  ArrowRightLeft,
  Coins,
  Lock,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface ReviewEvent {
  id: number
  action: string
  stage: string | null
  feedback: string | null
  internal_justification: string | null
  old_tier: string | null
  new_tier: string | null
  approved_hours: number | null
  override_hours: number | null
  coins_awarded: number | null
  refunded_coins: number | null
  member_breakdown:
    | { user_id: number; display_name: string; hours: number; coins: number }[]
    | null
  reviewer_display_name: string | null
  reviewer_avatar: string | null
  target_type: string | null
  target_label: string | null
  created_at: string
}

const ACTION_CONFIG: Record<string, { label: string; color: string; icon: LucideIcon }> = {
  'project.submitted_for_review': { label: 'Submitted for Review', color: 'text-foreground', icon: Send },
  'project.pitch_approved': { label: 'Pitch Approved', color: 'text-emerald-600 dark:text-emerald-400', icon: CheckCircle2 },
  'project.approved': { label: 'Project Approved', color: 'text-emerald-600 dark:text-emerald-400', icon: ShieldCheck },
  'project.returned': { label: 'Returned for Changes', color: 'text-amber-600 dark:text-amber-400', icon: Undo2 },
  'project.rejected': { label: 'Rejected', color: 'text-red-600 dark:text-red-400', icon: XCircle },
  'project.reverted_to_draft': { label: 'Reverted to Draft', color: 'text-muted-foreground', icon: FileEdit },
  'project.review_reversed': { label: 'Review Reversed', color: 'text-orange-600 dark:text-orange-400', icon: RotateCcw },
  'project.build_approved': { label: 'Build Approved', color: 'text-emerald-600 dark:text-emerald-400', icon: ShieldCheck },
  'project.build_returned': { label: 'Build Returned', color: 'text-amber-600 dark:text-amber-400', icon: Undo2 },
  'project.build_rejected': { label: 'Build Rejected', color: 'text-red-600 dark:text-red-400', icon: XCircle },
  'devlog.approved': { label: 'Devlog Approved', color: 'text-emerald-600 dark:text-emerald-400', icon: CheckCircle2 },
  'devlog.returned': { label: 'Devlog Returned', color: 'text-amber-600 dark:text-amber-400', icon: Undo2 },
  'project.tier_changed': { label: 'Tier Changed', color: 'text-sky-600 dark:text-sky-400', icon: ArrowRightLeft },
}

function fundingSummary(event: ReviewEvent): string | null {
  const parts: string[] = []
  if (event.approved_hours != null) {
    parts.push(`${Number(event.approved_hours).toFixed(1)} hrs approved${event.override_hours != null ? ' (override)' : ''}`)
  }
  if (event.coins_awarded != null) parts.push(`${Number(event.coins_awarded).toFixed(2)} coins awarded`)
  if (event.refunded_coins != null) parts.push(`${Number(event.refunded_coins).toFixed(2)} coins refunded`)
  return parts.length ? parts.join(' · ') : null
}

export default function AdminReviewTimeline({
  events,
  defaultExpanded = true,
}: {
  events: ReviewEvent[]
  defaultExpanded?: boolean
}) {
  const [open, setOpen] = useState(defaultExpanded)
  if (!events.length) return null

  return (
    <section className="rounded-md border border-border bg-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-2 bg-muted/50 hover:bg-muted/80 transition-colors cursor-pointer text-left"
      >
        <History className="size-4 text-muted-foreground" />
        <span className="text-sm font-semibold flex-1">Review Timeline</span>
        {open ? (
          <ChevronUp className="size-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="size-4 text-muted-foreground" />
        )}
      </button>
      {open && (
        <ol className="divide-y divide-border">
          {events.map((event) => {
            const cfg = ACTION_CONFIG[event.action] || { label: event.action, color: 'text-muted-foreground', icon: Info }
            const Icon = cfg.icon
            const funding = fundingSummary(event)
            return (
              <li key={event.id} className="p-3 flex gap-3">
                <Icon className={`size-4 shrink-0 mt-0.5 ${cfg.color}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-semibold uppercase tracking-wide ${cfg.color}`}>{cfg.label}</span>
                    {event.target_type === 'Devlog' && event.target_label && (
                      <span className="text-muted-foreground text-xs">· {event.target_label}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    {event.reviewer_avatar && (
                      <img src={event.reviewer_avatar} alt="" className="size-4 rounded-full" />
                    )}
                    <span>{event.reviewer_display_name || 'System'}</span>
                    <span>·</span>
                    <span>{event.created_at}</span>
                  </div>
                  {event.old_tier && event.new_tier && (
                    <div className="text-sm mt-1.5 capitalize">
                      {event.old_tier.replace('_', ' ')} → {event.new_tier.replace('_', ' ')}
                    </div>
                  )}
                  {funding && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1.5">
                      <Coins className="size-3 shrink-0" />
                      <span>{funding}</span>
                    </div>
                  )}
                  {event.member_breakdown && event.member_breakdown.length > 0 && (
                    <ul className="mt-1.5 space-y-0.5 text-xs text-muted-foreground">
                      {event.member_breakdown.map((m) => (
                        <li key={m.user_id} className="font-mono">
                          {m.display_name}: {Number(m.hours).toFixed(1)}h → {Number(m.coins).toFixed(2)}c
                        </li>
                      ))}
                    </ul>
                  )}
                  {event.feedback && (
                    <div className="markdown-content text-sm mt-2">
                      <Markdown remarkPlugins={[remarkGfm]}>{event.feedback}</Markdown>
                    </div>
                  )}
                  {event.internal_justification && (
                    <details className="mt-2 rounded-md border border-dashed border-border bg-muted/30">
                      <summary className="flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium text-muted-foreground cursor-pointer select-none">
                        <Lock className="size-3 shrink-0" />
                        Internal justification
                      </summary>
                      <div className="markdown-content text-sm px-2.5 pb-2">
                        <Markdown remarkPlugins={[remarkGfm]}>{event.internal_justification}</Markdown>
                      </div>
                    </details>
                  )}
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}
