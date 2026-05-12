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
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface ReviewEvent {
  id: number
  action: string
  stage: string | null
  feedback: string | null
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
                  {event.feedback && (
                    <div className="markdown-content text-sm mt-2">
                      <Markdown remarkPlugins={[remarkGfm]}>{event.feedback}</Markdown>
                    </div>
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
