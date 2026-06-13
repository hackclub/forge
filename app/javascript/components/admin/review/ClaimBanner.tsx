import { Lock } from 'lucide-react'
import { Button } from '@/components/admin/ui/button'

export interface ClaimState {
  locked_by: { name: string; avatar: string; since: string } | null
  can_take_over: boolean
}

export function ClaimBanner({
  claim,
  onTakeOver,
  takingOver,
}: {
  claim: ClaimState
  onTakeOver: () => void
  takingOver: boolean
}) {
  if (!claim.locked_by) return null
  return (
    <div className="bg-red-500/10 border-b border-red-500/40 px-4 py-2 flex items-center gap-2 text-sm text-red-700 dark:text-red-400 shrink-0">
      <Lock className="size-4 shrink-0" />
      <img src={claim.locked_by.avatar} alt="" className="size-4 rounded-full" />
      <span className="flex-1 min-w-0">
        <strong>{claim.locked_by.name}</strong> is reviewing this project — decisions are locked to avoid collisions.
      </span>
      {claim.can_take_over && (
        <Button variant="outline" size="sm" onClick={onTakeOver} disabled={takingOver}>
          {takingOver ? 'Taking over…' : 'Take over'}
        </Button>
      )}
    </div>
  )
}
