import { Clock, Film, ImageOff, TriangleAlert } from 'lucide-react'
import { Input } from '@/components/admin/ui/input'
import { cn } from '@/components/admin/lib/cn'
import type { ReviewDevlog } from './types'

export interface Deflation {
  hours: string
  reason: string
}

/** Claimed hours for one entry, treating a missing value as zero. */
export function claimedFor(entry: ReviewDevlog): number {
  return entry.time_hours ?? 0
}

/** Approved hours for one entry, clamped to what was claimed. */
export function approvedFor(entry: ReviewDevlog, deflation: Deflation | undefined): number {
  const claimed = claimedFor(entry)
  if (!deflation) return claimed
  const parsed = Number(deflation.hours)
  if (deflation.hours.trim() === '' || !Number.isFinite(parsed)) return claimed
  return Math.max(0, Math.min(parsed, claimed))
}

/** Entries whose approved hours are below claimed but carry no reason. */
export function unexplainedDeflations(devlogs: ReviewDevlog[], deflations: Record<number, Deflation>): ReviewDevlog[] {
  return devlogs.filter((entry) => {
    const approved = approvedFor(entry, deflations[entry.id])
    return approved < claimedFor(entry) - 0.001 && (deflations[entry.id]?.reason ?? '').trim().length < 10
  })
}

export function initialDeflations(devlogs: ReviewDevlog[]): Record<number, Deflation> {
  return Object.fromEntries(devlogs.map((e) => [e.id, { hours: String(claimedFor(e)), reason: '' }]))
}

/**
 * Per-entry hour approval, replacing the free-text evidence box and the single
 * flat hours override.
 *
 * Two fines drove this shape. Deflation had to be justified per item — "the
 * justification should specify what the hours were before and after deflation
 * and what specific evidence was used" — and a single free-text total could
 * disagree with the number actually submitted: "Justification says deflated to
 * 5.6 hours but Unified DB has 6.6 hours". Here the total is the sum of these
 * rows, so the two cannot drift apart.
 */
export function JournalDeflationTable({
  devlogs,
  projectId,
  deflations,
  onChange,
  disabled,
  invalid,
  isGroupProject,
}: {
  devlogs: ReviewDevlog[]
  projectId: number
  deflations: Record<number, Deflation>
  onChange: (id: number, patch: Partial<Deflation>) => void
  disabled: boolean
  invalid: boolean
  isGroupProject: boolean
}) {
  if (devlogs.length === 0) {
    return (
      <div className="rounded-md border border-border bg-card p-3">
        <p className="text-xs text-muted-foreground">
          No journal entries on this project, so there are no hours to approve or deflate.
        </p>
      </div>
    )
  }

  const totalClaimed = devlogs.reduce((sum, e) => sum + claimedFor(e), 0)
  const totalApproved = devlogs.reduce((sum, e) => sum + approvedFor(e, deflations[e.id]), 0)
  const deflated = Math.max(0, totalClaimed - totalApproved)
  const missing = unexplainedDeflations(devlogs, deflations)
  const deflatedCount = devlogs.filter((e) => approvedFor(e, deflations[e.id]) < claimedFor(e) - 0.001).length

  return (
    <div
      id="review-deflation"
      className={cn('rounded-md border border-border bg-card overflow-hidden', invalid && 'ring-2 ring-red-500/60')}
    >
      <div className="flex items-center gap-2 border-b border-border bg-muted/50 px-3 py-2">
        <Clock className="size-3.5 text-muted-foreground" />
        <span className="text-xs font-semibold">Hours per journal entry</span>
        <span className="ml-auto font-mono text-xs">
          <span className="text-muted-foreground">{totalClaimed.toFixed(1)}h</span>
          <span className="text-muted-foreground"> → </span>
          <span className={cn('font-semibold', deflated > 0 && 'text-amber-600 dark:text-amber-400')}>
            {totalApproved.toFixed(1)}h
          </span>
        </span>
      </div>

      <p className="border-b border-border px-3 py-1.5 text-[11px] text-muted-foreground">
        This has already been filled with the values that the user claimed, Read through the journals and update the
        hours and give a reason for updating accordingly!
      </p>

      <div className="divide-y divide-border/60">
        {devlogs.map((entry) => {
          const claimed = claimedFor(entry)
          const deflation = deflations[entry.id]
          const approved = approvedFor(entry, deflation)
          const isDeflated = approved < claimed - 0.001
          const needsReason = isDeflated && (deflation?.reason ?? '').trim().length < 10

          return (
            <div key={entry.id} className="space-y-1.5 px-3 py-2">
              <div className="flex items-start gap-2">
                <a
                  href={`/projects/${projectId}#devlog-${entry.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-w-0 flex-1 hover:underline"
                >
                  <span className="block truncate text-xs font-medium">{entry.title}</span>
                  <span className="flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
                    <span>{entry.created_at}</span>
                    {isGroupProject && <span>· {entry.user_display_name}</span>}
                    {entry.lapse_url && (
                      <span className="flex items-center gap-0.5">
                        · <Film className="size-2.5" /> lapse
                      </span>
                    )}
                    {!entry.validation.has_image && (
                      <span className="flex items-center gap-0.5">
                        · <ImageOff className="size-2.5" /> no image
                      </span>
                    )}
                    <span>· {entry.validation.content_length} chars</span>
                  </span>
                </a>

                <div className="flex shrink-0 items-center gap-1.5">
                  <span className="font-mono text-[11px] text-muted-foreground">{claimed.toFixed(1)}h →</span>
                  <Input
                    type="number"
                    step="0.25"
                    min={0}
                    max={claimed}
                    disabled={disabled}
                    value={deflation?.hours ?? String(claimed)}
                    onChange={(e) => onChange(entry.id, { hours: e.target.value })}
                    aria-label={`Approved hours for ${entry.title}`}
                    className={cn(
                      'h-7 w-20 text-center font-mono text-xs',
                      isDeflated && 'border-amber-600/60 text-amber-700 dark:text-amber-300',
                    )}
                  />
                </div>
              </div>

              {isDeflated && (
                <Input
                  disabled={disabled}
                  value={deflation?.reason ?? ''}
                  onChange={(e) => onChange(entry.id, { reason: e.target.value })}
                  placeholder={`Why is this ${(claimed - approved).toFixed(1)}h lower? e.g. "entry describes writing up earlier work, not building"`}
                  aria-label={`Reason for deflating ${entry.title}`}
                  className={cn('h-7 text-xs', needsReason && 'border-red-500/60')}
                />
              )}
            </div>
          )
        })}
      </div>

      {missing.length > 0 && (
        <div className="flex items-start gap-1.5 border-t border-border bg-red-500/5 px-3 py-2">
          <TriangleAlert className="mt-px size-3.5 shrink-0 text-red-600 dark:text-red-400" />
          <p className="text-[11px] text-red-700 dark:text-red-300">
            {missing.length} deflated {missing.length === 1 ? 'entry needs' : 'entries need'} a reason. Unexplained
            deflation is a fine on its own.
          </p>
        </div>
      )}

      {deflated > 0 && missing.length === 0 && (
        <div className="border-t border-border px-3 py-2 text-[11px] text-muted-foreground">
          {deflated.toFixed(1)}h deflated across {deflatedCount} {deflatedCount === 1 ? 'entry' : 'entries'}, each with
          a recorded reason.
        </div>
      )}
    </div>
  )
}
