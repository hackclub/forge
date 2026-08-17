import { Check, ExternalLink } from 'lucide-react'
import { Badge } from '@/components/admin/ui/badge'
import { cn } from '@/components/admin/lib/cn'
import type { RequirementsCheck, ReviewChecklistItem } from './types'

export function ReviewerChecklist({
  items,
  checked,
  onToggle,
  disabled,
  invalid,
  requirementsCheck,
  title = 'Reviewer checklist',
}: {
  items: ReviewChecklistItem[]
  checked: Record<string, boolean>
  onToggle: (key: string) => void
  disabled: boolean
  invalid: boolean
  requirementsCheck?: RequirementsCheck | null
  title?: string
}) {
  const done = items.filter((item) => checked[item.key]).length
  return (
    <div
      id="review-checklist"
      className={cn('rounded-md border border-border bg-card overflow-hidden', invalid && 'ring-2 ring-red-500/60')}
    >
      <div className="px-3 py-2 bg-muted/50 flex items-center gap-2 flex-wrap">
        <span className="text-sm font-semibold">{title}</span>
        {done === items.length ? (
          <Badge variant="success">Complete</Badge>
        ) : (
          <Badge variant="warning">
            {done} of {items.length}
          </Badge>
        )}
        {requirementsCheck && (
          <span className="text-[11px] text-muted-foreground">
            Requirements check passed{requirementsCheck.checked_by ? ` by ${requirementsCheck.checked_by}` : ''} ·{' '}
            {requirementsCheck.checked_at}
          </span>
        )}
      </div>
      <div className="p-3 space-y-1">
        {items.map((item) => (
          <div key={item.key} className="flex items-start gap-1.5">
            <button
              type="button"
              disabled={disabled}
              onClick={() => onToggle(item.key)}
              className={cn(
                'flex flex-1 items-start gap-2 rounded-md p-1 text-left transition-colors',
                disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:bg-muted/40',
              )}
            >
              <span
                className={cn(
                  'mt-px flex size-4 shrink-0 items-center justify-center rounded border border-border',
                  checked[item.key] && 'border-emerald-600 bg-emerald-600 dark:border-emerald-500 dark:bg-emerald-500',
                )}
              >
                {checked[item.key] && <Check className="size-3 text-white" strokeWidth={3} />}
              </span>
              <span className="min-w-0">
                <span
                  className={cn('block text-xs font-medium', checked[item.key] && 'text-muted-foreground line-through')}
                >
                  {item.label}
                </span>
                {item.note && <span className="block text-[11px] text-muted-foreground">{item.note}</span>}
              </span>
            </button>
            {item.doc && (
              <a
                href={item.doc}
                target="_blank"
                rel="noopener noreferrer"
                title="Handbook"
                className="mt-1.5 text-muted-foreground hover:text-foreground"
              >
                <ExternalLink className="size-3" />
              </a>
            )}
          </div>
        ))}
      </div>
      <div className="px-3 py-2 border-t border-border text-[11px] text-muted-foreground">
        Every item has to be ticked before you can approve. Anything you cannot tick is a return, not an approval.
      </div>
    </div>
  )
}
