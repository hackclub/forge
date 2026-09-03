import { useState } from 'react'
import { CalendarDays, ChevronRight, Clock, Film, Image, Info, TriangleAlert } from 'lucide-react'
import { cn } from '@/components/admin/lib/cn'
import type { JournalDigest, JournalDigestWeek } from './types'

/**
 * A weekly roll-up of the journal so a 50-entry project can be audited in
 * minutes instead of half an hour.
 *
 * This is the answer to the loudest complaint in the feedback thread — "it
 * often takes me 25-30 [minutes] to look through the proj", "The length of time
 * it takes, especially for projects with 50+ journals". It deliberately does
 * not summarise the *content* of entries: reviewers are accountable for the
 * hours, so this surfaces the things the fines actually turn on (pace, gaps,
 * backfilled entries, thin high-hour entries) and links out to the entries
 * worth opening.
 */
export function JournalDigestPanel({ digest, projectId }: { digest: JournalDigest; projectId: number }) {
  const [openWeek, setOpenWeek] = useState<string | null>(null)

  if (digest.entry_count === 0) {
    return <p className="text-xs text-muted-foreground">No journal entries on this project.</p>
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat icon={<CalendarDays className="size-3.5" />} label="Entries" value={String(digest.entry_count)} />
        <Stat icon={<Clock className="size-3.5" />} label="Hours" value={`${digest.total_hours}h`} />
        <Stat
          icon={<Image className="size-3.5" />}
          label="With images"
          value={`${digest.with_images}/${digest.entry_count}`}
        />
        <Stat icon={<Film className="size-3.5" />} label="Timelapses" value={String(digest.with_lapse)} />
      </div>

      <p className="text-[11px] text-muted-foreground">
        {digest.first_entry_on} → {digest.last_entry_on} · {digest.span_days} day span ·{' '}
        {(digest.total_hours / Math.max(1, digest.span_days)).toFixed(2)}h/day average
      </p>

      {digest.signals.length > 0 && (
        <ul className="space-y-1.5">
          {digest.signals.map((signal) => (
            <li
              key={signal.code}
              className={cn(
                'flex items-start gap-2 rounded-md border p-2',
                signal.level === 'warn' ? 'border-amber-600/40 bg-amber-500/5' : 'border-border bg-card',
              )}
            >
              {signal.level === 'warn' ? (
                <TriangleAlert className="mt-px size-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
              ) : (
                <Info className="mt-px size-3.5 shrink-0 text-muted-foreground" />
              )}
              <div className="min-w-0">
                <p className="text-xs font-medium">{signal.headline}</p>
                <p className="text-[11px] text-muted-foreground">{signal.why}</p>
                {signal.entry_ids.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {signal.entry_ids.map((id) => (
                      <a
                        key={id}
                        href={`/projects/${projectId}#devlog-${id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] hover:bg-muted/40"
                      >
                        #{id}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="overflow-hidden rounded-md border border-border">
        {digest.weeks.map((week) => (
          <WeekRow
            key={week.week_of}
            week={week}
            projectId={projectId}
            open={openWeek === week.week_of}
            onToggle={() => setOpenWeek(openWeek === week.week_of ? null : week.week_of)}
          />
        ))}
      </div>
    </div>
  )
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-card p-2">
      <div className="flex items-center gap-1 text-muted-foreground">
        {icon}
        <span className="text-[10px] uppercase tracking-wide">{label}</span>
      </div>
      <p className="font-mono text-sm font-semibold">{value}</p>
    </div>
  )
}

function WeekRow({
  week,
  projectId,
  open,
  onToggle,
}: {
  week: JournalDigestWeek
  projectId: number
  open: boolean
  onToggle: () => void
}) {
  return (
    <div className="border-b border-border last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-muted/40 cursor-pointer"
      >
        <ChevronRight
          className={cn('size-3.5 shrink-0 text-muted-foreground transition-transform', open && 'rotate-90')}
        />
        <span className="flex-1 text-xs font-medium">{week.label}</span>
        <span className="font-mono text-[11px] text-muted-foreground">
          {week.entries} {week.entries === 1 ? 'entry' : 'entries'}
        </span>
        <span className="w-14 text-right font-mono text-xs font-semibold">{week.hours}h</span>
      </button>

      {open && (
        <ul className="divide-y divide-border/60 border-t border-border/60 bg-muted/20">
          {week.items.map((item) => (
            <li key={item.id} className="flex items-start gap-2 px-3 py-1.5 pl-8">
              <a
                href={`/projects/${projectId}#devlog-${item.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="min-w-0 flex-1 hover:underline"
              >
                <span className="block truncate text-xs">{item.title}</span>
                <span className="block text-[10px] text-muted-foreground">
                  {item.entry_date} · {item.chars} chars
                  {!item.has_image && ' · no image'}
                  {item.backfilled && ` · written ${item.written_on}`}
                  {item.lapse_url && ' · timelapse'}
                </span>
              </a>
              <span
                className={cn(
                  'font-mono text-[11px]',
                  item.outlier ? 'font-semibold text-amber-600 dark:text-amber-400' : 'text-muted-foreground',
                )}
              >
                {item.hours}h
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
