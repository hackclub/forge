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
import { ReviewerChecklist } from './ReviewerChecklist'
import { JustificationLintPanel } from './JustificationLintPanel'
import { JustificationGuide } from './JustificationGuide'
import { DuplicateScanCard } from './DuplicateScanCard'
import { JournalDeflationTable, type Deflation } from './JournalDeflationTable'
import type { LintIssue } from '@/lib/justificationLint'
import type { AiCheckResult, InvalidReviewField, ReviewProject } from './types'

export interface DecisionPanelState {
  reasoning: string
  setReasoning: (v: string) => void
  timeSummary: string
  setTimeSummary: (v: string) => void
  technicalFeatures: string
  setTechnicalFeatures: (v: string) => void
  additionalJustification: string
  setAdditionalJustification: (v: string) => void
  feedback: string
  setFeedback: (v: string) => void
  submitting: null | 'approve' | 'return' | 'reject' | 'draft' | 'requirements_met'
}

export function DecisionPanel({
  project,
  can,
  checkpointChannelConfigured,
  canClaim,
  state,
  checks,
  onToggleCheck,
  deflations,
  onDeflationChange,
  approvedHours,
  claimedHours,
  deflation,
  previewCoins,
  justificationPreview,
  lintIssues,
  aiAudit,
  aiAuditing,
  onRunAiAudit,
  duplicateAcknowledgement,
  setDuplicateAcknowledgement,
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
  checks: Record<string, boolean>
  onToggleCheck: (key: string) => void
  deflations: Record<number, Deflation>
  onDeflationChange: (id: number, patch: Partial<Deflation>) => void
  approvedHours: number
  claimedHours: number
  deflation: number
  previewCoins: number
  justificationPreview: string
  lintIssues: LintIssue[]
  aiAudit: AiCheckResult | null
  aiAuditing: boolean
  onRunAiAudit: () => void
  duplicateAcknowledgement: string
  setDuplicateAcknowledgement: (v: string) => void
  approveReason: string | null
  returnReason: string | null
  invalidField: InvalidReviewField | null
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
    feedback,
    setFeedback,
    submitting,
  } = state

  const lockReason = canClaim ? null : 'Another reviewer holds this — take over to act'

  return (
    <>
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Submit Review</h3>

      <SubmissionRequirementsChecklist requirements={project.submission_requirements} />

      <ReviewerChecklist
        items={project.review_checklist}
        checked={checks}
        onToggle={onToggleCheck}
        disabled={!can.review || !canClaim}
        invalid={invalidField === 'checklist'}
        requirementsCheck={project.requirements_check}
      />

      <DuplicateScanCard
        scan={project.duplicate_scan}
        acknowledgement={duplicateAcknowledgement}
        setAcknowledgement={setDuplicateAcknowledgement}
        disabled={!can.review || !canClaim}
        invalid={invalidField === 'duplicate'}
      />

      <div className="space-y-3 rounded-md border border-border bg-card p-3">
        <div className="flex items-center gap-1.5">
          <ScrollText className="size-3.5 text-muted-foreground" />
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Your Justification
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground -mt-1">
          Internal Unified DB record. REMEMBER if this is not good we will get fined. Someone who does not know hardware
          should be able to check and understand the justification you gave
        </p>

        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Time evidence </label>
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

        <JournalDeflationTable
          devlogs={project.devlogs}
          projectId={project.id}
          deflations={deflations}
          onChange={onDeflationChange}
          disabled={!can.review || !canClaim}
          invalid={invalidField === 'override'}
          isGroupProject={project.is_group_project}
        />

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

        <JustificationLintPanel
          issues={lintIssues}
          aiAudit={aiAudit}
          aiAuditing={aiAuditing}
          onRunAiAudit={onRunAiAudit}
        />

        <CollapsibleSection
          title="Examples - What you should and shouldn't do"
          summary="Seven real justifications that were fined, and their fixes"
          storageKey="justification-guide-collapsed"
          defaultOpen={false}
        >
          <div className="p-3">
            <JustificationGuide
              guide={project.justification_guide}
              onUseExample={(text) => setReasoning(reasoning.trim() ? reasoning : text)}
            />
          </div>
        </CollapsibleSection>
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

      <div className="space-y-2 rounded-md border border-border bg-card p-3">
        <div className="flex items-center gap-1.5">
          <Clock className="size-3.5 text-muted-foreground" />
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Hours submitted</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="font-mono text-muted-foreground">{claimedHours.toFixed(1)}h claimed</span>
          <span className="text-muted-foreground">→</span>
          <span
            className={cn(
              'font-mono font-semibold',
              deflation > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-foreground',
            )}
          >
            {approvedHours.toFixed(1)}h approved
          </span>
          {deflation > 0 && (
            <span className="font-mono text-xs text-amber-600 dark:text-amber-400">
              (deflate {deflation.toFixed(1)}h)
            </span>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground">Calculated from above!</p>
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
