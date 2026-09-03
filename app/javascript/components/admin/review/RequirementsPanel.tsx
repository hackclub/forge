import { Check, Loader2, StickyNote, Undo2 } from 'lucide-react'
import { Button } from '@/components/admin/ui/button'
import { Textarea } from '@/components/admin/ui/textarea'
import { cn } from '@/components/admin/lib/cn'
import SubmissionRequirementsChecklist from '@/components/admin/SubmissionRequirementsChecklist'
import { ReviewerChecklist } from './ReviewerChecklist'
import type { InvalidReviewField, ReviewProject } from './types'

export function RequirementsPanel({
  project,
  checks,
  onToggleCheck,
  checklistComplete,
  feedback,
  setFeedback,
  submitting,
  canClaim,
  invalidField,
  onSubmit,
}: {
  project: ReviewProject
  checks: Record<string, boolean>
  onToggleCheck: (key: string) => void
  checklistComplete: boolean
  feedback: string
  setFeedback: (v: string) => void
  submitting: null | 'approve' | 'return' | 'reject' | 'draft' | 'requirements_met'
  canClaim: boolean
  invalidField: InvalidReviewField | null
  onSubmit: (decision: 'requirements_met' | 'return') => void
}) {
  const lockReason = canClaim ? null : 'Another reviewer holds this — take over to act'
  const passReason = checklistComplete ? null : 'Tick every item to pass the requirements check'
  const returnReason = feedback.trim() ? null : 'Tell the builder what is missing'

  return (
    <>
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Requirements Check</h3>
      <p className="text-[11px] text-muted-foreground -mt-2">
        Verify the submission meets the handbook requirements. Hours, coins and the final decision are left to the tier
        reviewer.
      </p>

      <SubmissionRequirementsChecklist requirements={project.submission_requirements} />

      <ReviewerChecklist
        items={project.review_checklist}
        checked={checks}
        onToggle={onToggleCheck}
        disabled={!canClaim}
        invalid={invalidField === 'checklist'}
        title="Requirements checklist"
      />

      <div className="space-y-2">
        <label className="text-xs text-muted-foreground flex items-center gap-1.5">
          <StickyNote className="size-3.5" />
          Feedback to builder <span className="text-muted-foreground/60">(required to return)</span>
        </label>
        <Textarea
          id="review-feedback"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Which requirement is missing, and what do they need to add?"
          className={cn('h-24 text-sm', invalidField === 'feedback' && 'ring-2 ring-red-500/60')}
        />
      </div>

      <div className="space-y-2 pt-1">
        <div title={passReason ?? lockReason ?? undefined}>
          <Button
            className="w-full"
            disabled={submitting !== null || passReason !== null || !canClaim}
            onClick={() => onSubmit('requirements_met')}
          >
            {submitting === 'requirements_met' ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Check className="size-4" />
            )}
            Requirements met
          </Button>
        </div>
        <div title={returnReason ?? lockReason ?? undefined}>
          <Button
            variant="outline"
            className="w-full"
            disabled={submitting !== null || returnReason !== null || !canClaim}
            onClick={() => onSubmit('return')}
          >
            {submitting === 'return' ? <Loader2 className="size-4 animate-spin" /> : <Undo2 className="size-4" />}
            Return (missing requirements)
          </Button>
        </div>
      </div>
    </>
  )
}
