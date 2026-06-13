import { AlertCircle } from 'lucide-react'
import type { ConcurrentReviewer } from './types'

export function ConcurrentReviewersBanner({ reviewers }: { reviewers: ConcurrentReviewer[] }) {
  if (reviewers.length === 0) return null
  return (
    <div className="bg-amber-500/10 border-b border-amber-500/40 px-4 py-2 flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400 shrink-0">
      <AlertCircle className="size-4 shrink-0" />
      <span>
        {reviewers.map((r) => r.reviewer_name).join(', ')} {reviewers.length === 1 ? 'is' : 'are'} currently reviewing
        this project. Coordinate to avoid duplicate decisions.
      </span>
    </div>
  )
}
