import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { router } from '@inertiajs/react'
import ReviewLayout from '@/layouts/ReviewLayout'
import { ReviewTopBar } from '@/components/admin/review/ReviewTopBar'
import { ConcurrentReviewersBanner } from '@/components/admin/review/ConcurrentReviewersBanner'
import { ClaimBanner, type ClaimState } from '@/components/admin/review/ClaimBanner'
import { SiblingReviewPanel } from '@/components/admin/review/SiblingReviewPanel'
import { FlagBanner } from '@/components/admin/review/FlagBanner'
import { FlagDialog } from '@/components/admin/review/FlagDialog'
import { ProjectOverviewCard } from '@/components/admin/review/ProjectOverviewCard'
import { FlagCards } from '@/components/admin/review/FlagCards'
import { ContentTabs } from '@/components/admin/review/ContentTabs'
import { ReviewerTimeAudit } from '@/components/admin/review/ReviewerTimeAudit'
import { DecisionPanel } from '@/components/admin/review/DecisionPanel'
import { ReadOnlyDecision } from '@/components/admin/review/ReadOnlyDecision'
import { SlackMessageDialog } from '@/components/admin/review/SlackMessageDialog'
import { ShortcutCheatsheet } from '@/components/admin/review/ShortcutCheatsheet'
import { isSafeUrl } from '@/components/admin/review/helpers'
import { useReviewHeartbeat } from '@/hooks/useReviewHeartbeat'
import { useReviewShortcuts } from '@/hooks/useReviewShortcuts'
import { trackReviewEvent } from '@/lib/reviewTracker'
import { buildJustification } from '@/lib/justificationPreview'
import type {
  AiCheckResult,
  ConcurrentReviewer,
  Reviewer,
  ReviewNote,
  ReviewProject,
  ReviewSession,
  SessionStats,
} from '@/components/admin/review/types'
import type { ReviewEvent } from '@/components/admin/AdminReviewTimeline'

const TAB_VALUES = ['journal', 'readme', 'pitch', 'description', 'notes', 'timeline', 'ai_check', 'files', 'changes']

function openExternal(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer')
}

export default function AdminReviewsShow({
  project,
  session,
  concurrent_reviewers,
  next_pending_id,
  reviewer,
  review_history,
  notes,
  can,
  claim,
  session_stats,
  checkpoint_channel_configured,
}: {
  project: ReviewProject
  session: ReviewSession | null
  concurrent_reviewers: ConcurrentReviewer[]
  next_pending_id: number | null
  reviewer: Reviewer
  review_history: ReviewEvent[]
  notes: ReviewNote[]
  can: { review: boolean; claim: boolean }
  claim: ClaimState
  session_stats: SessionStats | null
  checkpoint_channel_configured: boolean
}) {
  const isTerminal = project.status !== 'pending'
  useReviewHeartbeat(session?.heartbeat_path ?? null, session?.active_seconds ?? 0)
  const [readmeRefreshing, setReadmeRefreshing] = useState(false)

  const aiInProgress = (r: AiCheckResult | null) => r?.status === 'queued' || r?.status === 'running'
  const [aiResult, setAiResult] = useState<AiCheckResult | null>(project.ai_check_result)
  const [aiRanAt, setAiRanAt] = useState<string | null>(project.ai_check_ran_at)
  const [aiChecking, setAiChecking] = useState(aiInProgress(project.ai_check_result))
  const aiPollRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const track = useCallback(
    (button: string, metadata: Record<string, unknown> = {}) => {
      trackReviewEvent(project.id, button, metadata)
    },
    [project.id],
  )

  const pollAiStatus = useCallback(async () => {
    try {
      const res = await fetch(`/admin/projects/${project.id}/ai_requirements_check_status`, {
        credentials: 'same-origin',
        headers: { Accept: 'application/json' },
      })
      if (!res.ok) {
        aiPollRef.current = setTimeout(pollAiStatus, 2500)
        return
      }
      const data = await res.json()
      const next: AiCheckResult | null = data.result ?? null
      setAiResult(next)
      setAiRanAt(data.ran_at ?? null)
      if (next?.status === 'queued' || next?.status === 'running') {
        setAiChecking(true)
        aiPollRef.current = setTimeout(pollAiStatus, 2500)
      } else {
        setAiChecking(false)
      }
    } catch {
      aiPollRef.current = setTimeout(pollAiStatus, 3000)
    }
  }, [project.id])

  const runAiCheck = useCallback(async () => {
    track('ai_check_run')
    if (aiPollRef.current) clearTimeout(aiPollRef.current)
    setAiChecking(true)
    setAiResult({ status: 'queued' })
    setAiRanAt(null)
    try {
      const csrf = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? ''
      const res = await fetch(`/admin/projects/${project.id}/ai_requirements_check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf, Accept: 'application/json' },
        credentials: 'same-origin',
      })
      if (!res.ok) {
        setAiResult({ status: 'error', message: 'Failed to start the AI check. Try again in a moment.' })
        setAiChecking(false)
        return
      }
      aiPollRef.current = setTimeout(pollAiStatus, 1500)
    } catch {
      setAiResult({ status: 'error', message: 'Network error. Try again in a moment.' })
      setAiChecking(false)
    }
  }, [project.id, track, pollAiStatus])

  useEffect(() => {
    if (aiInProgress(project.ai_check_result)) {
      aiPollRef.current = setTimeout(pollAiStatus, 1500)
    }
    return () => {
      if (aiPollRef.current) clearTimeout(aiPollRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const refreshReadme = useCallback(() => {
    track('refresh_readme')
    setReadmeRefreshing(true)
    router.post(
      `/admin/projects/${project.id}/review`,
      { decision: 'refresh_readme' },
      {
        preserveScroll: true,
        onFinish: () => {
          setTimeout(() => {
            router.reload({ only: ['project'], onFinish: () => setReadmeRefreshing(false) })
          }, 1500)
        },
      },
    )
  }, [project.id, track])

  const [reasoning, setReasoning] = useState('')
  const [timeSummary, setTimeSummary] = useState('')
  const [scopeReasoning, setScopeReasoning] = useState('')
  const [evidence, setEvidence] = useState('')
  const [feedback, setFeedback] = useState('')
  const [overrideHours, setOverrideHours] = useState<string>(
    project.override_hours != null ? String(project.override_hours) : '',
  )
  const [overrideJustification, setOverrideJustification] = useState(project.override_hours_justification ?? '')
  const [submitting, setSubmitting] = useState<null | 'approve' | 'return' | 'reject' | 'draft'>(null)
  const [checkpointOpen, setCheckpointOpen] = useState(false)
  const [checkpointBody, setCheckpointBody] = useState('')
  const [checkpointSlackId, setCheckpointSlackId] = useState(project.user_slack_id ?? '')
  const [checkpointSending, setCheckpointSending] = useState(false)
  const [dmOpen, setDmOpen] = useState(false)
  const [dmBody, setDmBody] = useState('')
  const [dmSlackId, setDmSlackId] = useState(project.user_slack_id ?? '')
  const [dmSending, setDmSending] = useState(false)
  const [activeTab, setActiveTab] = useState('journal')
  const [helpOpen, setHelpOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [invalidField, setInvalidField] = useState<'conclusion' | 'feedback' | 'override' | null>(null)
  const [takingOver, setTakingOver] = useState(false)
  const [flagOpen, setFlagOpen] = useState(false)
  const [flagReason, setFlagReason] = useState('')
  const [flagging, setFlagging] = useState(false)
  const [unflagging, setUnflagging] = useState(false)

  const openCheckpoint = useCallback(() => {
    setCheckpointBody(feedback)
    setCheckpointSlackId(project.user_slack_id ?? '')
    setCheckpointOpen(true)
  }, [feedback, project.user_slack_id])

  const sendCheckpoint = useCallback(() => {
    const body = checkpointBody.trim()
    const slackId = checkpointSlackId.trim()
    if (!body) {
      alert('Message body is required.')
      return
    }
    if (!slackId) {
      alert('Builder Slack ID is required.')
      return
    }
    setCheckpointSending(true)
    router.post(
      `/admin/projects/${project.id}/send_checkpoint_message`,
      { body, user_slack_id: slackId },
      {
        preserveScroll: true,
        onFinish: () => {
          setCheckpointSending(false)
          setCheckpointOpen(false)
        },
      },
    )
  }, [project.id, checkpointBody, checkpointSlackId])

  const openDm = useCallback(() => {
    setDmBody(feedback)
    setDmSlackId(project.user_slack_id ?? '')
    setDmOpen(true)
  }, [feedback, project.user_slack_id])

  const sendDm = useCallback(() => {
    const body = dmBody.trim()
    const slackId = dmSlackId.trim()
    if (!body) {
      alert('Message body is required.')
      return
    }
    if (!slackId) {
      alert('Builder Slack ID is required.')
      return
    }
    setDmSending(true)
    router.post(
      `/admin/projects/${project.id}/send_dm_message`,
      { body, user_slack_id: slackId },
      {
        preserveScroll: true,
        onFinish: () => {
          setDmSending(false)
          setDmOpen(false)
        },
      },
    )
  }, [project.id, dmBody, dmSlackId])

  const reviewerMentionPreview = reviewer.slack_id ? `<@${reviewer.slack_id}>` : reviewer.display_name
  const builderMentionPreview = checkpointSlackId.trim() ? `<@${checkpointSlackId.trim()}>` : '<@?>'

  const claimedHours = project.devlog_hours
  const approvedHours = useMemo(() => {
    const v = parseFloat(overrideHours)
    if (overrideHours.trim() === '' || !Number.isFinite(v)) return claimedHours
    return Math.max(0, Math.min(v, claimedHours))
  }, [overrideHours, claimedHours])
  const deflation = Math.max(0, claimedHours - approvedHours)
  const previewCoins = Math.round(approvedHours * project.coin_rate * 100) / 100

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://forge.hackclub.com'
  const justificationPreview = useMemo(
    () =>
      buildJustification({
        kind: project.build_review ? 'build' : 'design',
        name: project.name,
        record_label: `project #${project.id}`,
        submitted_at_iso: project.created_at_iso,
        reviewer_name: reviewer.display_name,
        reviewer_email: reviewer.email || null,
        claimed_hours: claimedHours,
        approved_hours: approvedHours,
        repo_link: project.repo_link,
        devlog_count: project.devlogs.length,
        public_url: `${origin}/projects/${project.id}`,
        admin_url: `${origin}/admin/projects/${project.id}`,
        time_summary: timeSummary,
        scope_reasoning: scopeReasoning,
        evidence,
        assessment: reasoning,
        deflation_reason: overrideJustification,
      }),
    [
      project,
      reviewer,
      claimedHours,
      approvedHours,
      origin,
      timeSummary,
      scopeReasoning,
      evidence,
      reasoning,
      overrideJustification,
    ],
  )

  const changeTier = useCallback(
    (newTier: string) => {
      if (newTier === project.tier) return
      if (!confirm(`Change tier from ${project.tier.replace('_', ' ')} to ${newTier.replace('_', ' ')}?`)) return
      track('change_tier', { from: project.tier, to: newTier })
      router.post(`/admin/projects/${project.id}/change_tier`, { tier: newTier }, { preserveScroll: true })
    },
    [project.id, project.tier, track],
  )

  const convertReviewType = useCallback(() => {
    const toBuild = !project.build_review
    if (
      !confirm(
        `Convert this to a ${toBuild ? 'build' : 'design'} review? It moves to the ${toBuild ? 'build' : 'design'} queue.`,
      )
    )
      return
    track('convert_review_type', { to: toBuild ? 'build' : 'design' })
    router.post(`/admin/projects/${project.id}/convert_review_type`, {}, { preserveScroll: true })
  }, [project.id, project.build_review, track])

  const submit = useCallback(
    (decision: 'approve' | 'return' | 'reject' | 'draft') => {
      track(`${decision}_clicked`)
      const payload: Record<string, string | number | null> = { decision }
      if (decision === 'approve') {
        if (!reasoning.trim()) {
          return
        }
        payload.reasoning = reasoning.trim()
        payload.time_summary = timeSummary.trim() || null
        payload.scope_reasoning = scopeReasoning.trim() || null
        payload.evidence = evidence.trim() || null
        payload.feedback = feedback.trim() || null
        if (overrideHours.trim() !== '') {
          payload.override_hours = overrideHours.trim()
          if (!overrideJustification.trim()) {
            return
          }
          payload.override_hours_justification = overrideJustification.trim()
        }
      } else if (decision === 'draft') {
        payload.feedback = feedback.trim() || null
      } else {
        if (!feedback.trim()) {
          return
        }
        payload.feedback = feedback.trim()
      }
      setSubmitting(decision)
      router.post(`/admin/projects/${project.id}/review`, payload, {
        onFinish: () => setSubmitting(null),
      })
    },
    [
      project.id,
      reasoning,
      timeSummary,
      scopeReasoning,
      evidence,
      feedback,
      overrideHours,
      overrideJustification,
      track,
    ],
  )

  const approveReason = useMemo<string | null>(() => {
    if (!reasoning.trim()) return 'Add a reviewer conclusion to approve'
    if (overrideHours.trim() !== '' && !overrideJustification.trim())
      return 'Add a deflation reason for the hours override'
    return null
  }, [reasoning, overrideHours, overrideJustification])
  const returnReason = useMemo<string | null>(
    () => (!feedback.trim() ? 'Add feedback to the builder' : null),
    [feedback],
  )

  const flash = useCallback((field: 'conclusion' | 'feedback' | 'override') => {
    setInvalidField(field)
    window.setTimeout(() => setInvalidField(null), 1200)
  }, [])

  const focusReasoning = useCallback(() => {
    document.getElementById('review-conclusion')?.focus()
  }, [])
  const focusFeedback = useCallback(() => {
    document.getElementById('review-feedback')?.focus()
  }, [])

  const openRepo = useCallback(() => {
    if (isSafeUrl(project.repo_link)) {
      track('open_repo', { url: project.repo_link })
      openExternal(project.repo_link)
    }
  }, [project.repo_link, track])
  const openCommits = useCallback(() => {
    if (isSafeUrl(project.commits_url)) openExternal(project.commits_url)
  }, [project.commits_url])
  const openUser = useCallback(() => {
    track('open_user')
    openExternal(`/admin/users/${project.user_id}`)
  }, [project.user_id, track])
  const openPublic = useCallback(() => {
    track('open_public')
    openExternal(`/projects/${project.id}`)
  }, [project.id, track])

  const handleApprove = useCallback(() => {
    if (!can.claim) return
    if (approveReason) {
      if (!reasoning.trim()) {
        focusReasoning()
        flash('conclusion')
      } else {
        document.getElementById('review-override')?.focus()
        flash('override')
      }
      return
    }
    submit('approve')
  }, [can.claim, approveReason, reasoning, focusReasoning, flash, submit])

  const handleReturn = useCallback(() => {
    if (!can.claim) return
    if (returnReason) {
      focusFeedback()
      flash('feedback')
      return
    }
    submit('return')
  }, [can.claim, returnReason, focusFeedback, flash, submit])

  const handleReject = useCallback(() => {
    if (!can.claim) return
    if (returnReason) {
      focusFeedback()
      flash('feedback')
      return
    }
    track('reject_open')
    setRejectOpen(true)
  }, [can.claim, returnReason, focusFeedback, flash, track])

  const handleDraft = useCallback(() => {
    if (!can.claim) return
    submit('draft')
  }, [can.claim, submit])

  const smartSubmit = useCallback(() => {
    if (!can.claim) return
    if (!approveReason) {
      submit('approve')
      return
    }
    if (!returnReason) {
      submit('return')
      return
    }
    if (!reasoning.trim()) {
      focusReasoning()
      flash('conclusion')
    } else {
      focusFeedback()
      flash('feedback')
    }
  }, [can.claim, approveReason, returnReason, reasoning, submit, focusReasoning, focusFeedback, flash])

  const onSkip = useCallback(() => {
    if (next_pending_id) {
      track('skip', { next_id: next_pending_id })
      router.visit(`/admin/reviews/${next_pending_id}`)
    }
  }, [next_pending_id, track])
  const onEndSession = useCallback(() => {
    track('end_session')
    router.visit('/admin/reviews')
  }, [track])

  const takeOver = useCallback(() => {
    setTakingOver(true)
    router.post(
      `/admin/reviews/${project.id}/claim`,
      {},
      { preserveScroll: true, onFinish: () => setTakingOver(false) },
    )
  }, [project.id])

  const submitFlag = useCallback(() => {
    const reason = flagReason.trim()
    if (!reason) return
    setFlagging(true)
    router.post(
      `/admin/projects/${project.id}/flag_for_review`,
      { reason },
      {
        preserveScroll: true,
        onSuccess: () => {
          setFlagOpen(false)
          setFlagReason('')
        },
        onFinish: () => setFlagging(false),
      },
    )
  }, [project.id, flagReason])

  const unflag = useCallback(() => {
    setUnflagging(true)
    router.post(
      `/admin/projects/${project.id}/unflag_for_review`,
      {},
      { preserveScroll: true, onFinish: () => setUnflagging(false) },
    )
  }, [project.id])

  const demoUrl = project.ships.find((s) => s.demo_link)?.demo_link ?? project.build_proof_url ?? null

  useReviewShortcuts({
    enabled: !isTerminal && !checkpointOpen && !dmOpen && !rejectOpen && !helpOpen,
    onApprove: handleApprove,
    onReturn: handleReturn,
    onReject: handleReject,
    onDraft: handleDraft,
    onSkip,
    onEndSession,
    focusReasoning,
    focusFeedback,
    openRepo,
    openUser,
    openPublic,
    openCommits,
    runAiCheck,
    setTab: setActiveTab,
    tabValues: TAB_VALUES,
    smartSubmit,
    toggleNotes: () => setActiveTab('notes'),
    toggleHelp: () => setHelpOpen((v) => !v),
    closeOverlays: () => setHelpOpen(false),
  })

  return (
    <div className="h-screen flex flex-col overflow-hidden border-t-2 border-orange-500">
      <ReviewTopBar
        project={project}
        session={session}
        nextPendingId={next_pending_id}
        onTrack={track}
        onShowHelp={() => setHelpOpen(true)}
        notesCount={notes.length}
        onToggleNotes={() => setActiveTab('notes')}
        flagged={project.flagged_for_review}
        onFlag={() => setFlagOpen(true)}
        commitsUrl={project.commits_url}
        demoUrl={demoUrl}
      />

      {project.flagged_for_review && (
        <FlagBanner
          reason={project.flag_reason}
          flaggedBy={project.flagged_by_name}
          canUnflag={reviewer.is_superadmin}
          onUnflag={unflag}
          unflagging={unflagging}
        />
      )}
      {claim.locked_by ? (
        <ClaimBanner claim={claim} onTakeOver={takeOver} takingOver={takingOver} />
      ) : (
        <ConcurrentReviewersBanner reviewers={concurrent_reviewers} />
      )}

      <div className="flex-1 min-h-0 flex">
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <ProjectOverviewCard project={project} claimedHours={claimedHours} previewCoins={previewCoins} />

          <FlagCards greenFlags={project.green_flags} redFlags={project.red_flags} />

          <ContentTabs
            project={project}
            notes={notes}
            reviewHistory={review_history}
            readmeRefreshing={readmeRefreshing}
            onRefreshReadme={refreshReadme}
            aiResult={aiResult}
            aiRanAt={aiRanAt}
            aiChecking={aiChecking}
            onRunAiCheck={runAiCheck}
            value={activeTab}
            onValueChange={setActiveTab}
            currentUserId={reviewer.id}
            isSuperadmin={reviewer.is_superadmin}
          />

          {reviewer.is_superadmin && session_stats && session_stats.sessions.length > 0 && (
            <ReviewerTimeAudit sessionStats={session_stats} />
          )}
        </div>

        <div className="w-px shrink-0 bg-border" />

        <div className="w-[440px] shrink-0 overflow-y-auto p-4 space-y-4">
          {project.sibling && <SiblingReviewPanel sibling={project.sibling} />}
          {isTerminal ? (
            <ReadOnlyDecision project={project} next_pending_id={next_pending_id} />
          ) : (
            <>
              <DecisionPanel
                project={project}
                can={can}
                checkpointChannelConfigured={checkpoint_channel_configured}
                canClaim={can.claim}
                state={{
                  reasoning,
                  setReasoning,
                  timeSummary,
                  setTimeSummary,
                  scopeReasoning,
                  setScopeReasoning,
                  evidence,
                  setEvidence,
                  feedback,
                  setFeedback,
                  overrideHours,
                  setOverrideHours,
                  overrideJustification,
                  setOverrideJustification,
                  submitting,
                }}
                claimedHours={claimedHours}
                deflation={deflation}
                previewCoins={previewCoins}
                justificationPreview={justificationPreview}
                approveReason={approveReason}
                returnReason={returnReason}
                invalidField={invalidField}
                rejectOpen={rejectOpen}
                onRejectOpenChange={setRejectOpen}
                onSubmit={submit}
                onChangeTier={changeTier}
                onConvertReviewType={convertReviewType}
                onOpenCheckpoint={openCheckpoint}
                onOpenDm={openDm}
                onTrack={track}
              />

              <SlackMessageDialog
                open={checkpointOpen}
                onOpenChange={setCheckpointOpen}
                title="Send to #forge-checkpoint"
                description="Posts as the Forge Keeper bot. Edit the body below before sending."
                intro={`Hey ${builderMentionPreview}! Our team of smiths have had a look at your project and here's what we had to say!`}
                outro={`From ${reviewerMentionPreview}, please discuss in this thread for any questions/feedback!`}
                slackId={checkpointSlackId}
                setSlackId={setCheckpointSlackId}
                body={checkpointBody}
                setBody={setCheckpointBody}
                sending={checkpointSending}
                onSend={sendCheckpoint}
                slackIdMissing={!project.user_slack_id}
              />

              <SlackMessageDialog
                open={dmOpen}
                onOpenChange={setDmOpen}
                title="Send DM to builder"
                description="Posts as the Forge Keeper bot, straight to the builder's Slack DMs. Edit the body below before sending."
                intro={"Hey! Our team of smiths have had a look at your project and here's what we had to say!"}
                outro={`From ${reviewerMentionPreview} — please DM your reviewer if you have any questions, or resubmit once you've worked on this feedback!`}
                slackId={dmSlackId}
                setSlackId={setDmSlackId}
                body={dmBody}
                setBody={setDmBody}
                sending={dmSending}
                onSend={sendDm}
                slackIdMissing={!project.user_slack_id}
              />
            </>
          )}
        </div>
      </div>

      <ShortcutCheatsheet open={helpOpen} onClose={() => setHelpOpen(false)} />
      <FlagDialog
        open={flagOpen}
        onOpenChange={setFlagOpen}
        reason={flagReason}
        setReason={setFlagReason}
        onSubmit={submitFlag}
        submitting={flagging}
      />
    </div>
  )
}

AdminReviewsShow.layout = (page: ReactNode) => <ReviewLayout>{page}</ReviewLayout>
