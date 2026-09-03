import { Copy, ExternalLink, ShieldAlert, ShieldCheck, ShieldQuestion } from 'lucide-react'
import { Textarea } from '@/components/admin/ui/textarea'
import { cn } from '@/components/admin/lib/cn'
import type { DuplicateScan } from './types'

/**
 * Double-dip detection, asked for directly by reviewers ("We should have a
 * thingy that checks if a project is double dipped or not like macondo",
 * "can you have unified tables check if double dipped etc").
 *
 * It is the largest fine category across every program (164 of 700) and four of
 * Forge's own fines were repos already submitted to Blueprint or Stasis.
 */
export function DuplicateScanCard({
  scan,
  acknowledgement,
  setAcknowledgement,
  disabled,
  invalid,
}: {
  scan: DuplicateScan
  acknowledgement: string
  setAcknowledgement: (v: string) => void
  disabled: boolean
  invalid: boolean
}) {
  const blocked = scan.verdict === 'blocked'
  const needsLook = scan.verdict === 'review'
  const total = scan.forge.length + scan.unified.length + scan.macondo.length

  if (scan.verdict === 'clear' && total === 0) {
    // A lookup that failed is not a clean bill of health, so it gets the amber
    // treatment rather than the green one.
    const degraded = scan.unified_error || !scan.unified_available
    return (
      <div
        className={cn(
          'flex items-start gap-2 rounded-md border p-3',
          degraded ? 'border-amber-600/40 bg-amber-500/5' : 'border-border bg-card',
        )}
      >
        {degraded ? (
          <ShieldQuestion className="mt-px size-4 shrink-0 text-amber-600 dark:text-amber-400" />
        ) : (
          <ShieldCheck className="mt-px size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
        )}
        <div className="min-w-0">
          <p className="text-xs font-semibold">
            {degraded ? 'Duplicate check is incomplete' : 'No duplicate submissions found'}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {scan.unified_error
              ? "Couldn't reach the Unified DB — Forge and Macondo came back clean, but check the unified table yourself before approving."
              : scan.unified_available
                ? 'Checked Forge, the Unified DB and Macondo for this repo.'
                : 'Checked Forge only — no Unified DB token is configured, so verify by hand.'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'rounded-md border overflow-hidden',
        blocked ? 'border-red-600/50 bg-red-500/5' : 'border-amber-600/50 bg-amber-500/5',
        invalid && 'ring-2 ring-red-500/60',
      )}
    >
      <div className="flex items-center gap-2 px-3 py-2">
        {blocked ? (
          <ShieldAlert className="size-4 shrink-0 text-red-600 dark:text-red-400" />
        ) : (
          <ShieldQuestion className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
        )}
        <span className="text-xs font-semibold">
          {blocked ? 'This repo is already submitted elsewhere' : 'Same repo on other Forge projects'}
        </span>
      </div>

      <div className="space-y-2 border-t border-border/60 px-3 py-2">
        {scan.unified.map((row) => (
          <a
            key={row.record_id}
            href={row.record_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-2 rounded border border-border bg-card p-2 hover:bg-muted/40"
          >
            <Copy className="mt-px size-3 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-medium">Unified DB · {row.program}</span>
              <span className="block text-[11px] text-muted-foreground">
                {[row.submitter, row.status, row.hours ? `${row.hours}h` : null, row.created_at]
                  .filter(Boolean)
                  .join(' · ')}
              </span>
              {/* That program may already have justified this same duplicate,
                  which is useful context rather than a reason to wave it on. */}
              {row.duplicate_justification && (
                <span className="mt-1 block text-[11px] italic text-muted-foreground">
                  Their duplicate note: {row.duplicate_justification}
                </span>
              )}
            </span>
            <ExternalLink className="mt-px size-3 shrink-0 text-muted-foreground" />
          </a>
        ))}

        {scan.macondo.map((row) => (
          <div key={row.id} className="rounded border border-border bg-card p-2">
            <p className="text-xs font-medium">Macondo · {row.title ?? row.id}</p>
            <p className="text-[11px] text-muted-foreground">Already shipped on Macondo.</p>
          </div>
        ))}

        {scan.forge.map((row) => (
          <a
            key={row.id}
            href={row.path}
            className="flex items-start gap-2 rounded border border-border bg-card p-2 hover:bg-muted/40"
          >
            <Copy className="mt-px size-3 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-medium">
                Forge · {row.name}
                {row.build_review ? ' (build)' : ''}
              </span>
              <span className="block text-[11px] text-muted-foreground">
                {[row.owner, row.status, row.same_owner ? 'same builder' : 'different builder']
                  .filter(Boolean)
                  .join(' · ')}
              </span>
            </span>
          </a>
        ))}
      </div>

      {blocked && (
        <div className="space-y-1.5 border-t border-border/60 px-3 py-2">
          <label className="text-xs text-muted-foreground">
            Why is this not double-dipping? <span className="text-muted-foreground/60">(required to approve)</span>
          </label>
          <Textarea
            id="review-duplicate"
            value={acknowledgement}
            onChange={(e) => setAcknowledgement(e.target.value)}
            disabled={disabled}
            placeholder="e.g. This is an update to the Blueprint ship — the Blueprint submission covered the PCB only; these 6h are the enclosure work committed after Mar 12."
            className="h-16 text-sm"
          />
          <p className="text-[11px] text-muted-foreground">
            Please explain why this is not double dipping - eg project is worked on by multiple collaborators or project
            is an update or a build ship. Make sure to justify this otherwise it can cause a fine!!
          </p>
        </div>
      )}

      {needsLook && (
        <div className="border-t border-border/60 px-3 py-2 text-[11px] text-muted-foreground">
          A design/build pair or a genuine update legitimately shares a repo — just make sure the justification says
          which.
        </div>
      )}
    </div>
  )
}
