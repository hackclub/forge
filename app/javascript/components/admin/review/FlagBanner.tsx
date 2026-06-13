import { Flag } from 'lucide-react'
import { Button } from '@/components/admin/ui/button'

export function FlagBanner({
  reason,
  flaggedBy,
  canUnflag,
  onUnflag,
  unflagging,
}: {
  reason: string | null
  flaggedBy: string | null
  canUnflag: boolean
  onUnflag: () => void
  unflagging: boolean
}) {
  return (
    <div className="bg-red-500/10 border-b border-red-500/40 px-4 py-2 flex items-center gap-2 text-sm text-red-700 dark:text-red-400 shrink-0">
      <Flag className="size-4 shrink-0" />
      <span className="flex-1 min-w-0">
        Flagged{flaggedBy ? ` by ${flaggedBy}` : ''}
        {reason ? `: ${reason}` : ''} — pulled from the queue.
      </span>
      {canUnflag && (
        <Button variant="outline" size="sm" onClick={onUnflag} disabled={unflagging}>
          {unflagging ? 'Clearing…' : 'Clear flag'}
        </Button>
      )}
    </div>
  )
}
