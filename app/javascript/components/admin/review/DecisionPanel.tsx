import { Check, Clock, FileEdit, Loader2, ScrollText, Send, StickyNote, Undo2, X } from 'lucide-react'
import { Button } from '@/components/admin/ui/button'
import { Input } from '@/components/admin/ui/input'
import { Textarea } from '@/components/admin/ui/textarea'
import { Separator } from '@/components/admin/ui/separator'
import { cn } from '@/components/admin/lib/cn'
import { tierCoinRate } from '@/lib/tiers'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/admin/ui/alert-dialog'
import SubmissionRequirementsChecklist from '@/components/admin/SubmissionRequirementsChecklist'
import { CollapsibleSection } from './CollapsibleSection'
import { isSafeUrl } from './helpers'
import type { ReviewProject } from './types'

export interface DecisionPanelState {
  reasoning: string
  setReasoning: (v: string) => void
  timeSummary: string
  setTimeSummary: (v: string) => void
  technicalFeatures: string
  setTechnicalFeatures: (v: string) => void
  additionalJustification: string
  setAdditionalJustification: (v: string) => void
  evidence: string
  setEvidence: (v: string) => void
  feedback: string
  setFeedback: (v: string) => void
  overrideHours: string
  setOverrideHours: (v: string) => void
  overrideJustification: string
  setOverrideJustification: (v: string) => void
  submitting: null | 'approve' | 'return' | 'reject' | 'draft'
}

export function DecisionPanel({
  project,
  can,
  checkpointChannelConfigured,
  canClaim,
  state,
  claimedHours,
  deflation,
  previewCoins,
  justificationPreview,
  approveReason,
  returnReason,
  invalidField,
  rejectOpen,
  onRejectOpenChange,
  onSubmit,
  onChangeTier,
  onConvertReviewType,
  onOpenCheckpoint,
  onOpenDm,
  onTrack,
}: {
  project: ReviewProject
  can: { review: boolean }
  checkpointChannelConfigured: boolean
  canClaim: boolean
  state: DecisionPanelState
  claimedHours: number
  deflation: number
  previewCoins: number
  justificationPreview: string
  approveReason: string | null
  returnReason: string | null
  invalidField: 'conclusion' | 'technical' | 'feedback' | 'override' | null
  rejectOpen: boolean
  onRejectOpenChange: (open: boolean) => void
  onSubmit: (decision: 'approve' | 'return' | 'reject' | 'draft') => void
  onChangeTier: (tier: string) => void
  onConvertReviewType: () => void
  onOpenCheckpoint: () => void
  onOpenDm: () => void
  onTrack: (button: string, metadata?: Record<string, unknown>) => void
}) {
  const {
    reasoning,
    setReasoning,
    timeSummary,
    setTimeSummary,
    technicalFeatures,
    setTechnicalFeatures,
    additionalJustification,
    setAdditionalJustification,
    evidence,
    setEvidence,
    feedback,
    setFeedback,
    overrideHours,
    setOverrideHours,
    overrideJustification,
    setOverrideJustification,
    submitting,
  } = state

  const lockReason = canClaim ? null : 'Another reviewer holds this — take over to act'

  return (
    <>
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Submit Review</h3>

      <SubmissionRequirementsChecklist requirements={project.submission_requirements} />

      <div className="space-y-3 rounded-md border border-border bg-card p-3">
        <div className="flex items-center gap-1.5">
          <ScrollText className="size-3.5 text-muted-foreground" />
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Override Hours Justification
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground -mt-1">
          Internal Unified DB record. REMEMBER if this is not good we will get fined. Someone who does not know hardware
          should be able to check and understand the justification you gave
        </p>

        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">
            Time evidence{' '}
            <span className="text-muted-foreground/60">
              (auto-filled from devlogs and commits — edit if the journal shows more)
            </span>
          </label>
          <Textarea
            value={timeSummary}
            onChange={(e) => setTimeSummary(e.target.value)}
            placeholder="9 journal entries Feb 3–17, 12.4h logged; pace consistent with the hours."
            className="h-20 text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">
            Specific technical features <span className="text-muted-foreground/60">(required to approve)</span>
          </label>
          <Textarea
            id="review-technical"
            value={technicalFeatures}
            onChange={(e) => setTechnicalFeatures(e.target.value)}
            placeholder='Concrete implementation work only, e.g. "custom ESP32 PCB with USB-C charging, CAD case in Fusion, PID motor firmware". Not just languages or "cool project".'
            className={cn('h-16 text-sm', invalidField === 'technical' && 'ring-2 ring-red-500/60')}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground flex items-center justify-between">
            <span>Supporting evidence (one link per line)</span>
            {project.commits_url && isSafeUrl(project.commits_url) && (
              <a
                href={project.commits_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground hover:underline"
              >
                commits ↗
              </a>
            )}
          </label>
          <Textarea
            value={evidence}
            onChange={(e) => setEvidence(e.target.value)}
            placeholder="https://… devlog — shows incremental progress&#10;https://… timelapse — covers the build"
            className="h-16 text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">
            Why do the hours match the work? <span className="text-muted-foreground/60">(required to approve)</span>
          </label>
          <Textarea
            id="review-conclusion"
            value={reasoning}
            onChange={(e) => setReasoning(e.target.value)}
            placeholder="Cite what you checked: journal pace, commit history, timelapse coverage — a stranger should reach the same conclusion from your links."
            className={cn('h-16 text-sm', invalidField === 'conclusion' && 'ring-2 ring-red-500/60')}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">
            Anything suspicious or needing extra context? <span className="text-muted-foreground/60">(optional)</span>
          </label>
          <Textarea
            value={additionalJustification}
            onChange={(e) => setAdditionalJustification(e.target.value)}
            placeholder="Only for odd cases: AI-heavy code, hours spread strangely, reused work — say what you saw and why it's still fine."
            className="h-14 text-sm"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs text-muted-foreground flex items-center gap-1.5">
          <StickyNote className="size-3.5" />
          Feedback to builder <span className="text-muted-foreground/60">(required for return / reject)</span>
        </label>
        <Textarea
          id="review-feedback"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="What does the builder need to know?"
          className={cn('h-20 text-sm', invalidField === 'feedback' && 'ring-2 ring-red-500/60')}
        />
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={onOpenCheckpoint}
          disabled={!checkpointChannelConfigured}
          title={checkpointChannelConfigured ? undefined : 'FORGE_CHECKPOINT_CHANNEL_ID is not set'}
        >
          <Send className="size-3.5" />
          Send to #forge-checkpoint
        </Button>
        <Button variant="outline" size="sm" className="w-full" onClick={onOpenDm}>
          <Send className="size-3.5" />
          Send to DM
        </Button>
      </div>

      <Separator />

      {!project.build_review && (
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">Override tier</label>
          <select
            value={project.tier}
            onChange={(e) => onChangeTier(e.target.value)}
            className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground cursor-pointer"
          >
            <option value="tier_4">Tier 4 — {tierCoinRate('tier_4')}</option>
            <option value="tier_3">Tier 3 — {tierCoinRate('tier_3')}</option>
            <option value="tier_2">Tier 2 — {tierCoinRate('tier_2')}</option>
            <option value="tier_1">Tier 1 — {tierCoinRate('tier_1')}</option>
          </select>
          {project.from_slack && project.tier !== 'tier_1' && (
            <p className="text-amber-600 dark:text-amber-400 text-[11px]">
              Originally a Slack pitch — tier was changed by staff.
            </p>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={onConvertReviewType}
        className="w-full h-9 rounded-md border border-border bg-background px-3 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors cursor-pointer"
      >
        {project.build_review ? 'Convert to design review' : 'Convert to build review'}
      </button>

      <Separator />

      <div className="space-y-2">
        <label className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Clock className="size-3.5" />
          Override hours <span className="text-muted-foreground/60">(leave blank to keep claimed)</span>
        </label>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground font-mono">{claimedHours.toFixed(1)}h</span>
          <span className="text-muted-foreground">→</span>
          <Input
            type="number"
            step="0.5"
            min={0}
            max={claimedHours}
            value={overrideHours}
            onChange={(e) => setOverrideHours(e.target.value)}
            placeholder="claimed"
            className="h-8 w-24 font-mono text-center"
          />
          <span
            className={cn(
              'font-mono text-xs',
              deflation > 0 ? 'text-amber-600 dark:text-amber-400 font-semibold' : 'text-muted-foreground',
            )}
          >
            deflate {deflation.toFixed(1)}h
          </span>
        </div>
        {overrideHours.trim() !== '' && (
          <Input
            id="review-override"
            value={overrideJustification}
            onChange={(e) => setOverrideJustification(e.target.value)}
            placeholder="Deflation reason (recorded in the justification)"
            className={cn('h-8 text-sm', invalidField === 'override' && 'ring-2 ring-red-500/60')}
          />
        )}
      </div>

      <CollapsibleSection
        title="Justification preview"
        summary="What goes to the Unified DB"
        storageKey="preview"
        defaultOpen
      >
        <pre className="p-3 text-[11px] whitespace-pre-wrap font-mono leading-relaxed text-muted-foreground">
          {justificationPreview}
        </pre>
      </CollapsibleSection>

      <div className="space-y-2 pt-1">
        <div title={approveReason ?? lockReason ?? undefined}>
          <Button
            className="w-full"
            disabled={submitting !== null || !can.review || approveReason !== null || !canClaim}
            onClick={() => onSubmit('approve')}
          >
            {submitting === 'approve' ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
            Approve · {previewCoins.toFixed(2)}c
          </Button>
        </div>
        <div title={returnReason ?? lockReason ?? undefined}>
          <Button
            variant="outline"
            className="w-full"
            disabled={submitting !== null || !can.review || returnReason !== null || !canClaim}
            onClick={() => onSubmit('return')}
          >
            {submitting === 'return' ? <Loader2 className="size-4 animate-spin" /> : <Undo2 className="size-4" />}
            Return (needs changes)
          </Button>
        </div>
        <div title={lockReason ?? undefined}>
          <Button
            variant="ghost"
            className="w-full"
            disabled={submitting !== null || !can.review || !canClaim}
            onClick={() => onSubmit('draft')}
          >
            <FileEdit className="size-4" />
            Send back to Draft
          </Button>
        </div>
        <div title={returnReason ?? lockReason ?? undefined}>
          <Button
            variant="destructive"
            className="w-full"
            disabled={submitting !== null || !can.review || returnReason !== null || !canClaim}
            onClick={() => {
              onTrack('reject_open')
              onRejectOpenChange(true)
            }}
          >
            <X className="size-4" />
            Reject
          </Button>
        </div>
        <AlertDialog open={rejectOpen} onOpenChange={onRejectOpenChange}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reject project?</AlertDialogTitle>
              <AlertDialogDescription>
                Rejection means no payout at all. Use Return for projects that need changes.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => onTrack('reject_cancel')}>Cancel</AlertDialogCancel>
              <AlertDialogAction variant="destructive" onClick={() => onSubmit('reject')}>
                Reject
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  )
}
