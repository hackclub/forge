import { Link } from '@inertiajs/react'
import { ChevronDown, History, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/admin/ui/button'
import { trackReviewEvent } from '@/lib/reviewTracker'
import { statusBadge } from './helpers'
import type { ReviewProject } from './types'

export function ReadOnlyDecision({
  project,
  next_pending_id,
}: {
  project: ReviewProject
  next_pending_id: number | null
}) {
  return (
    <>
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Review Complete</h3>
        {statusBadge(project.status)}
      </div>
      {project.reviewer_display_name && (
        <p className="text-xs text-muted-foreground">
          by {project.reviewer_display_name}
          {project.reviewed_at ? ` · ${project.reviewed_at}` : ''}
        </p>
      )}
      {project.review_feedback && (
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground uppercase tracking-wide">Feedback</label>
          <p className="text-sm whitespace-pre-wrap rounded-md border border-border bg-muted/30 p-2">
            {project.review_feedback}
          </p>
        </div>
      )}
      <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-700 dark:text-amber-400 flex gap-2">
        <ShieldAlert className="size-4 shrink-0 mt-0.5" />
        <span>This project is no longer pending. To undo a review use "Reverse Review" on the project admin page.</span>
      </div>
      <div className="flex gap-2">
        <Button
          asChild
          variant="outline"
          className="flex-1"
          onClick={() => trackReviewEvent(project.id, 'view_project')}
        >
          <Link href={`/admin/projects/${project.id}`}>
            <History className="size-4" />
            Project page
          </Link>
        </Button>
        {next_pending_id && (
          <Button
            asChild
            className="flex-1"
            onClick={() => trackReviewEvent(project.id, 'next_project', { next_id: next_pending_id })}
          >
            <Link href={`/admin/reviews/${next_pending_id}`}>
              Next pending
              <ChevronDown className="size-4 -rotate-90" />
            </Link>
          </Button>
        )}
      </div>
    </>
  )
}
