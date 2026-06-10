import { Check, X, AlertCircle } from 'lucide-react'
import { Badge } from '@/components/admin/ui/badge'
import { cn } from '@/components/admin/lib/cn'
import type { SubmissionRequirement } from '@/types'

export default function SubmissionRequirementsChecklist({ requirements }: { requirements: SubmissionRequirement[] }) {
  const missing = requirements.filter((r) => r.ok === false)
  const manual = requirements.filter((r) => r.ok === null)
  return (
    <div className="rounded-md border border-border bg-card overflow-hidden">
      <div className="px-3 py-2 bg-muted/50 flex items-center gap-2">
        <span className="text-sm font-semibold">Required submission fields</span>
        {missing.length > 0 ? (
          <Badge variant="destructive">{missing.length} missing</Badge>
        ) : (
          <Badge variant="success">Complete</Badge>
        )}
        {manual.length > 0 && <Badge variant="warning">{manual.length} to verify</Badge>}
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 p-3">
        {requirements.map((r) => (
          <div key={r.key} className="flex items-start gap-1.5 text-xs" title={r.detail ?? undefined}>
            {r.ok === true ? (
              <Check className="size-3.5 shrink-0 mt-px text-emerald-600 dark:text-emerald-400" />
            ) : r.ok === false ? (
              <X className="size-3.5 shrink-0 mt-px text-red-600 dark:text-red-400" />
            ) : (
              <AlertCircle className="size-3.5 shrink-0 mt-px text-amber-600 dark:text-amber-400" />
            )}
            <span className={cn(r.ok === false && 'text-red-600 dark:text-red-400')}>{r.label}</span>
          </div>
        ))}
      </div>
      {(missing.length > 0 || manual.length > 0) && (
        <div className="px-3 py-2 border-t border-border text-[11px] text-muted-foreground">
          Submissions sent to the Unified DB must have every field. If a field is missing and you do not understand please message @Aarav J on slack
        </div>
      )}
    </div>
  )
}
