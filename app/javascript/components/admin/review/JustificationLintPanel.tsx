import { useState } from 'react'
import { AlertTriangle, CheckCircle2, ChevronDown, Loader2, Quote, ShieldAlert, Sparkles } from 'lucide-react'
import { Button } from '@/components/admin/ui/button'
import { cn } from '@/components/admin/lib/cn'
import type { LintIssue } from '@/lib/justificationLint'
import type { AiCheckResult } from './types'

const FIELD_LABEL: Record<string, string> = {
  assessment: 'Why the hours match',
  technical_features: 'Technical features',
  evidence: 'Supporting evidence',
  override: 'Hour override',
}

/**
 * Live feedback on the justification, keyed to the fine each rule prevents.
 *
 * Reviewers said they were "unsure whether the reviews do actually pass" and
 * asked for the AI to check justifications during review. Showing the real fine
 * alongside each problem is the part that teaches — it turns an abstract
 * complaint into "this exact sentence cost us money last month".
 */
export function JustificationLintPanel({
  issues,
  aiAudit,
  aiAuditing,
  onRunAiAudit,
}: {
  issues: LintIssue[]
  aiAudit: AiCheckResult | null
  aiAuditing: boolean
  onRunAiAudit: () => void
}) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const blocking = issues.filter((i) => i.severity === 'block')
  const warnings = issues.filter((i) => i.severity === 'warn')

  const auditBlock = (
    <AiAuditBlock audit={aiAudit} auditing={aiAuditing} onRun={onRunAiAudit} blocked={blocking.length > 0} />
  )

  if (issues.length === 0) {
    return (
      <div className="space-y-2">
        <div className="flex items-start gap-2 rounded-md border border-emerald-600/40 bg-emerald-500/5 p-3">
          <CheckCircle2 className="mt-px size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              Justification clears every fine check
            </p>
            <p className="text-[11px] text-muted-foreground">
              Specific, numbered, and independently checkable. This is what a passing record looks like.
            </p>
          </div>
        </div>
        {auditBlock}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div
        className={cn(
          'rounded-md border overflow-hidden',
          blocking.length > 0 ? 'border-red-600/50 bg-red-500/5' : 'border-amber-600/50 bg-amber-500/5',
        )}
      >
        <div className="flex items-center gap-2 px-3 py-2">
          {blocking.length > 0 ? (
            <ShieldAlert className="size-4 shrink-0 text-red-600 dark:text-red-400" />
          ) : (
            <AlertTriangle className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
          )}
          <span className="text-xs font-semibold">
            {blocking.length > 0
              ? `${blocking.length} thing${blocking.length === 1 ? '' : 's'} that would get us fined`
              : `${warnings.length} thing${warnings.length === 1 ? '' : 's'} worth a second look`}
          </span>
          {blocking.length > 0 && warnings.length > 0 && (
            <span className="text-[11px] text-muted-foreground">+{warnings.length} warning</span>
          )}
        </div>

        <ul className="divide-y divide-border/60 border-t border-border/60">
          {[...blocking, ...warnings].map((issue) => {
            const key = `${issue.field}/${issue.code}`
            const open = expanded === key
            return (
              <li key={key} className="px-3 py-2">
                <div className="flex items-start gap-2">
                  <span
                    className={cn(
                      'mt-1 size-1.5 shrink-0 rounded-full',
                      issue.severity === 'block' ? 'bg-red-600 dark:bg-red-400' : 'bg-amber-600 dark:bg-amber-400',
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      {FIELD_LABEL[issue.field] ?? issue.field}
                    </p>
                    <p className="text-xs text-foreground">{issue.message}</p>
                    {issue.fine && (
                      <button
                        type="button"
                        onClick={() => setExpanded(open ? null : key)}
                        className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        <ChevronDown className={cn('size-3 transition-transform', open && 'rotate-180')} />
                        {open ? 'Hide the fine' : 'See the fine this prevents'}
                      </button>
                    )}
                    {open && issue.fine && (
                      <blockquote className="mt-1.5 flex gap-1.5 rounded border border-border bg-card p-2">
                        <Quote className="mt-px size-3 shrink-0 text-muted-foreground" />
                        <span className="text-[11px] italic leading-relaxed text-muted-foreground">{issue.fine}</span>
                      </blockquote>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
      {auditBlock}
    </div>
  )
}

/**
 * The paid second opinion. The static rules above catch the phrasings that were
 * fined; this reads the justification as a whole against the handbook, which is
 * what catches a justification that is specific but still wrong.
 */
function AiAuditBlock({
  audit,
  auditing,
  onRun,
  blocked,
}: {
  audit: AiCheckResult | null
  auditing: boolean
  onRun: () => void
  blocked: boolean
}) {
  const verdict = audit?.overall
  return (
    <div className="rounded-md border border-border bg-card">
      <div className="flex items-center gap-2 px-3 py-2">
        <Sparkles className="size-3.5 shrink-0 text-muted-foreground" />
        <span className="flex-1 text-xs font-semibold">Second opinion</span>
        <Button variant="outline" size="sm" onClick={onRun} disabled={auditing || blocked}>
          {auditing ? <Loader2 className="size-3.5 animate-spin" /> : null}
          {auditing ? 'Reading…' : 'Audit justification'}
        </Button>
      </div>
      {blocked && !audit && (
        <p className="border-t border-border px-3 py-2 text-[11px] text-muted-foreground">
          Fix the issues above first!
        </p>
      )}
      {audit && (
        <div className="space-y-2 border-t border-border px-3 py-2">
          <p
            className={cn(
              'text-xs font-medium',
              verdict === 'pass' && 'text-emerald-700 dark:text-emerald-300',
              verdict === 'fail' && 'text-red-700 dark:text-red-300',
              verdict === 'uncertain' && 'text-amber-700 dark:text-amber-300',
            )}
          >
            {audit.summary ?? audit.message ?? 'No summary returned.'}
          </p>
          {audit.requirements?.map((req) => (
            <div key={req.name} className="flex items-start gap-2">
              <span
                className={cn(
                  'mt-1 size-1.5 shrink-0 rounded-full',
                  req.verdict === 'pass' && 'bg-emerald-600 dark:bg-emerald-400',
                  req.verdict === 'fail' && 'bg-red-600 dark:bg-red-400',
                  req.verdict === 'uncertain' && 'bg-amber-600 dark:bg-amber-400',
                )}
              />
              <div className="min-w-0">
                <p className="text-[11px] font-medium">{req.name}</p>
                <p className="text-[11px] text-muted-foreground">{req.reasoning}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
