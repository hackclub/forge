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
import { ContentTabs, visibleTabValues } from '@/components/admin/review/ContentTabs'
import { ReviewerTimeAudit } from '@/components/admin/review/ReviewerTimeAudit'
import { DecisionPanel } from '@/components/admin/review/DecisionPanel'
import { RequirementsPanel } from '@/components/admin/review/RequirementsPanel'
import { ReadOnlyDecision } from '@/components/admin/review/ReadOnlyDecision'
import { SlackMessageDialog } from '@/components/admin/review/SlackMessageDialog'
import { ShortcutCheatsheet } from '@/components/admin/review/ShortcutCheatsheet'
import { isSafeUrl } from '@/components/admin/review/helpers'
import { useReviewHeartbeat } from '@/hooks/useReviewHeartbeat'
import { useReviewShortcuts } from '@/hooks/useReviewShortcuts'
import { trackReviewEvent } from '@/lib/reviewTracker'
import { buildJustification, buildTimeEvidence, type CommitStats } from '@/lib/justificationPreview'
import { hasBlockingIssues, lintJustification, type JustificationRules } from '@/lib/justificationLint'
import {
  approvedFor,
  claimedFor,
  initialDeflations,
  unexplainedDeflations,
  type Deflation,
} from '@/components/admin/review/JournalDeflationTable'
import type {
  AiCheckResult,
  InvalidReviewField,
  ConcurrentReviewer,
  Reviewer,
  ReviewNote,
  ReviewProject,
  ReviewSession,
  SessionStats,
} from '@/components/admin/review/types'
import type { ReviewEvent } from '@/components/admin/AdminReviewTimeline'

function openExternal(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer')
}

export default function AdminReviewsShow({
  project,
  session,
  concurrent_reviewers,
  next_pending_id,
  queue_path,
  reviewer,
  review_history,
  notes,
  can,
  claim,
  session_stats,
  checkpoint_channel_configured,
  justification_rules,
}: {
  project: ReviewProject
  session: ReviewSession | null
  concurrent_reviewers: ConcurrentReviewer[]
  next_pending_id: number | null
  queue_path: string
  reviewer: Reviewer
  review_history: ReviewEvent[]
  notes: ReviewNote[]
  can: { review: boolean; requirements_check: boolean; claim: boolean; unflag: boolean }
  claim: ClaimState
  session_stats: SessionStats | null
  checkpoint_channel_configured: boolean
  justification_rules: JustificationRules | null
}) {
  const isTerminal = project.status !== 'pending'
  const { releaseSession } = useReviewHeartbeat(
    session?.heartbeat_path ?? null,
    session?.release_path ?? null,
    session?.active_seconds ?? 0,
  )
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

  const requirementsOnly = !can.review && can.requirements_check
  const checklistStorageKey = `review:checklist:${project.id}`
  const [checks, setChecks] = useState<Record<string, boolean>>(() => {
    try {
      const stored = localStorage.getItem(checklistStorageKey)
      if (stored) return JSON.parse(stored) as Record<string, boolean>
    } catch {}
    const passed = project.requirements_check?.items ?? []
    return Object.fromEntries(passed.map((key) => [key, true]))
  })
  const toggleCheck = useCallback(
    (key: string) => {
      setChecks((current) => {
        const next = { ...current, [key]: !current[key] }
        try {
          localStorage.setItem(checklistStorageKey, JSON.stringify(next))
        } catch {}
        return next
      })
    },
    [checklistStorageKey],
  )
  const checklistDone = project.review_checklist.filter((item) => checks[item.key]).length
  const checklistComplete = checklistDone === project.review_checklist.length

  const [reasoning, setReasoning] = useState('')
  const [timeSummary, setTimeSummary] = useState(() => buildTimeEvidence(project))
  const autoTimeSummary = useRef(timeSummary)
  const [technicalFeatures, setTechnicalFeatures] = useState('')
  const [additionalJustification, setAdditionalJustification] = useState('')
  const [duplicateAcknowledgement, setDuplicateAcknowledgement] = useState('')
  // Prefilled with each entry's claimed hours. This is the only place hours are
  // set, so the justification and the submitted total cannot disagree.
  const [deflations, setDeflations] = useState<Record<number, Deflation>>(() => initialDeflations(project.devlogs))
  const setDeflation = useCallback((id: number, patch: Partial<Deflation>) => {
    setDeflations((current) => {
      const existing = current[id] ?? { hours: '', reason: '' }
      return { ...current, [id]: { ...existing, ...patch } }
    })
  }, [])
  const [justificationAudit, setJustificationAudit] = useState<AiCheckResult | null>(null)
  const [justificationAuditing, setJustificationAuditing] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [submitting, setSubmitting] = useState<null | 'approve' | 'return' | 'reject' | 'draft' | 'requirements_met'>(
    null,
  )
  const [checkpointOpen, setCheckpointOpen] = useState(false)
  const [checkpointBody, setCheckpointBody] = useState('')
  const [checkpointSlackId, setCheckpointSlackId] = useState(project.user_slack_id ?? '')
  const [checkpointSending, setCheckpointSending] = useState(false)
  const [dmOpen, setDmOpen] = useState(false)
  const [dmBody, setDmBody] = useState('')
  const [dmSlackId, setDmSlackId] = useState(project.user_slack_id ?? '')
  const [dmSending, setDmSending] = useState(false)
  // Every review opens on the digest: the pace, gaps and hour outliers it
  // surfaces are what the hours decision turns on, and reading entries in order
  // is the 25-minute review reviewers complained about.
  const [activeTab, setActiveTab] = useState('digest')
  // Shared with the tab strip so the number-key shortcuts never point at a
  // tab that is hidden for this project's tier.
  const tabValues = useMemo(() => visibleTabValues(project), [project])
  const [helpOpen, setHelpOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [invalidField, setInvalidField] = useState<InvalidReviewField | null>(null)
  const [takingOver, setTakingOver] = useState(false)
  const [flagOpen, setFlagOpen] = useState(false)
  const [flagReason, setFlagReason] = useState('')
  const [flagging, setFlagging] = useState(false)
  const [unflagging, setUnflagging] = useState(false)

  useEffect(() => {
    if (!project.repo_link) return
    let cancelled = false
    fetch(`/admin/projects/${project.id}/commit_stats`, {
      credentials: 'same-origin',
      headers: { Accept: 'application/json' },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: (CommitStats & { available: boolean }) | null) => {
        if (cancelled || !data?.available) return
        const next = buildTimeEvidence(project, data)
        setTimeSummary((current) => (current === autoTimeSummary.current ? next : current))
        autoTimeSummary.current = next
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.id, project.repo_link])

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
  // Approved hours are the sum of the per-entry approvals — never typed twice.
  const approvedHours = useMemo(
    () => Math.round(project.devlogs.reduce((sum, e) => sum + approvedFor(e, deflations[e.id]), 0) * 100) / 100,
    [project.devlogs, deflations],
  )
  const deflation = Math.max(0, claimedHours - approvedHours)

  // Each deflated entry states its own before/after and reason, which is what
  // the fines ask for; the aggregate is composed rather than written by hand.
  const overrideJustification = useMemo(
    () =>
      project.devlogs
        .filter((e) => approvedFor(e, deflations[e.id]) < claimedFor(e) - 0.001)
        .map((e) => {
          const reason = (deflations[e.id]?.reason ?? '').trim()
          // Entry titles contain colons ("August 12: Competition date!"), so the
          // reason is separated with an em dash to stay unambiguous.
          return `- "${e.title}" ${claimedFor(e).toFixed(1)}h → ${approvedFor(e, deflations[e.id]).toFixed(1)}h — ${reason}`
        })
        .join('\n'),
    [project.devlogs, deflations],
  )

  // The evidence block reviewers asked to have prefilled, now carrying the
  // per-entry outcome rather than just a link.
  const evidence = useMemo(
    () =>
      project.devlogs
        .map((e) => {
          const claimed = claimedFor(e)
          const approved = approvedFor(e, deflations[e.id])
          const verdict =
            approved < claimed - 0.001
              ? `claimed ${claimed.toFixed(1)}h, approved ${approved.toFixed(1)}h`
              : `${claimed.toFixed(1)}h approved in full`
          const lapse = e.lapse_url ? ` — timelapse: ${e.lapse_url}` : ''
          return `${window.location.origin}/projects/${project.id}#devlog-${e.id} — ${e.created_at}: ${e.title} (${verdict})${lapse}`
        })
        .join('\n'),
    [project.devlogs, project.id, deflations],
  )

  const overrideHours = deflation > 0.001 ? String(approvedHours) : ''
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
        timelapse_urls: [...new Set(project.devlogs.map((d) => (d.lapse_url ?? '').trim()).filter(Boolean))],
        public_url: `${origin}/projects/${project.id}`,
        admin_url: `${origin}/admin/projects/${project.id}`,
        time_summary: timeSummary,
        technical_features: technicalFeatures,
        evidence,
        assessment: reasoning,
        additional_justification: additionalJustification,
        deflation_reason: overrideJustification,
      }),
    [
      project,
      reviewer,
      claimedHours,
      approvedHours,
      origin,
      timeSummary,
      technicalFeatures,
      evidence,
      reasoning,
      additionalJustification,
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
    (decision: 'approve' | 'return' | 'reject' | 'draft' | 'requirements_met') => {
      track(`${decision}_clicked`)
      const payload: Record<string, string | number | string[] | null> = { decision }
      if (decision === 'requirements_met') {
        if (!checklistComplete) {
          return
        }
        payload.checklist = project.review_checklist.map((item) => item.key)
      } else if (decision === 'approve') {
        if (!reasoning.trim() || !technicalFeatures.trim() || !checklistComplete) {
          return
        }
        payload.checklist = project.review_checklist.map((item) => item.key)
        payload.reasoning = reasoning.trim()
        payload.time_summary = timeSummary.trim() || null
        payload.technical_features = technicalFeatures.trim() || null
        payload.additional_justification = additionalJustification.trim() || null
        payload.evidence = evidence.trim() || null
        payload.feedback = feedback.trim() || null
        payload.duplicate_acknowledgement = duplicateAcknowledgement.trim() || null
        payload.journal_deflations = JSON.stringify(
          project.devlogs.map((e) => ({
            devlog_id: e.id,
            approved_hours: approvedFor(e, deflations[e.id]),
            reason: (deflations[e.id]?.reason ?? '').trim(),
          })),
        )
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
        onSuccess: () => {
          try {
            localStorage.removeItem(checklistStorageKey)
          } catch {}
        },
        onFinish: () => setSubmitting(null),
      })
    },
    [
      project.id,
      project.review_checklist,
      checklistComplete,
      checklistStorageKey,
      reasoning,
      timeSummary,
      technicalFeatures,
      additionalJustification,
      evidence,
      feedback,
      overrideHours,
      overrideJustification,
      duplicateAcknowledgement,
      deflations,
      project.devlogs,
      track,
    ],
  )

  // Audits the justification the reviewer has typed so far. On demand rather
  // than automatic: it costs a model call, and the static linter has already
  // caught the phrasings we were fined for.
  const runJustificationAudit = useCallback(async () => {
    setJustificationAuditing(true)
    track('justification_ai_audit')
    try {
      const res = await fetch(`/admin/projects/${project.id}/check_draft_justification`, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-CSRF-Token': document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '',
        },
        body: JSON.stringify({ justification: justificationPreview, approved_hours: approvedHours }),
      })
      // The endpoint answers with a JSON result even on failure, so read the
      // body regardless of status. Anything that is not JSON (an auth redirect
      // landing on an HTML page, a proxy error page) is reported with its status
      // rather than collapsed into one unhelpful message.
      const body = await res.text()
      let parsed: { result?: AiCheckResult } | null = null
      try {
        parsed = JSON.parse(body)
      } catch {
        parsed = null
      }
      setJustificationAudit(
        parsed?.result ?? {
          overall: 'error',
          message: res.redirected
            ? `The audit request was redirected to ${res.url} — you may not have review permission for this tier.`
            : `The audit request failed (HTTP ${res.status}).`,
        },
      )
    } catch (e) {
      setJustificationAudit({
        overall: 'error',
        message: `Could not reach the audit endpoint: ${e instanceof Error ? e.message : 'network error'}`,
      })
    } finally {
      setJustificationAuditing(false)
    }
  }, [project.id, justificationPreview, approvedHours, track])

  const hasLapse = useMemo(() => project.devlogs.some((d) => (d.lapse_url ?? '').trim().length > 0), [project.devlogs])

  // Runs on every keystroke against the rule table the server sent, so the
  // reviewer sees the problem while writing. The server re-runs the same rules
  // on submit — this is the hint, not the gate.
  const lintIssues = useMemo(
    () =>
      lintJustification(
        {
          timeSummary,
          technicalFeatures,
          evidence,
          assessment: reasoning,
          additional: additionalJustification,
          deflationReason: overrideJustification,
          claimedHours,
          approvedHours,
          journalOnly: project.devlog_mode !== 'git',
          usesAi: project.uses_ai,
          hasLapse,
          redFlags: project.red_flags ?? [],
        },
        justification_rules,
      ),
    [
      timeSummary,
      technicalFeatures,
      evidence,
      reasoning,
      additionalJustification,
      overrideJustification,
      claimedHours,
      approvedHours,
      project.devlog_mode,
      project.uses_ai,
      project.red_flags,
      hasLapse,
      justification_rules,
    ],
  )

  const duplicateBlocked = project.duplicate_scan.verdict === 'blocked' && duplicateAcknowledgement.trim().length < 20

  // The composed aggregate reason is long enough to satisfy the text linter even
  // when every per-entry reason is blank, so the per-entry check has to be its
  // own gate rather than relying on JustificationLint.
  const missingDeflationReasons = useMemo(
    () => unexplainedDeflations(project.devlogs, deflations),
    [project.devlogs, deflations],
  )

  const approveReason = useMemo<string | null>(() => {
    if (project.self_review) return 'You cannot approve your own project'
    if (!checklistComplete)
      return `Complete the reviewer checklist (${checklistDone}/${project.review_checklist.length}) to approve`
    if (!technicalFeatures.trim()) return 'List the specific technical features to approve'
    if (!reasoning.trim()) return 'Explain why the hours match the work to approve'
    if (overrideHours.trim() !== '' && !overrideJustification.trim())
      return 'Add a deflation reason for the hours override'
    if (duplicateBlocked) return 'Explain why this duplicate repo is not double-dipping to approve'
    if (missingDeflationReasons.length > 0)
      return `Give a reason for ${missingDeflationReasons.length} deflated journal entr${missingDeflationReasons.length === 1 ? 'y' : 'ies'}`
    if (hasBlockingIssues(lintIssues))
      return `Fix ${lintIssues.filter((i) => i.severity === 'block').length} justification issue(s) that would get us fined`
    return null
  }, [
    project.self_review,
    checklistComplete,
    checklistDone,
    project.review_checklist.length,
    technicalFeatures,
    reasoning,
    overrideHours,
    overrideJustification,
    duplicateBlocked,
    missingDeflationReasons,
    lintIssues,
  ])
  const returnReason = useMemo<string | null>(
    () => (!feedback.trim() ? 'Add feedback to the builder' : null),
    [feedback],
  )

  const flash = useCallback((field: InvalidReviewField) => {
    setInvalidField(field)
    window.setTimeout(() => setInvalidField(null), 1200)
  }, [])

  const focusChecklist = useCallback(() => {
    document.getElementById('review-checklist')?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    flash('checklist')
  }, [flash])

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
      if (!checklistComplete) {
        focusChecklist()
      } else if (!technicalFeatures.trim()) {
        document.getElementById('review-technical')?.focus()
        flash('technical')
      } else if (!reasoning.trim()) {
        focusReasoning()
        flash('conclusion')
      } else {
        document.getElementById('review-override')?.focus()
        flash('override')
      }
      return
    }
    submit('approve')
  }, [
    can.claim,
    approveReason,
    checklistComplete,
    focusChecklist,
    technicalFeatures,
    reasoning,
    focusReasoning,
    flash,
    submit,
  ])

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
    if (!checklistComplete) {
      focusChecklist()
    } else if (!technicalFeatures.trim()) {
      document.getElementById('review-technical')?.focus()
      flash('technical')
    } else if (!reasoning.trim()) {
      focusReasoning()
      flash('conclusion')
    } else {
      focusFeedback()
      flash('feedback')
    }
  }, [
    can.claim,
    approveReason,
    returnReason,
    checklistComplete,
    focusChecklist,
    technicalFeatures,
    reasoning,
    submit,
    focusReasoning,
    focusFeedback,
    flash,
  ])

  const onSkip = useCallback(() => {
    if (next_pending_id) {
      track('skip', { next_id: next_pending_id })
      router.visit(`/admin/reviews/${next_pending_id}`)
    }
  }, [next_pending_id, track])
  const onEndSession = useCallback(() => {
    track('end_session')
    releaseSession().finally(() => router.visit(queue_path))
  }, [track, queue_path, releaseSession])

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
    enabled: !isTerminal && !requirementsOnly && !checkpointOpen && !dmOpen && !rejectOpen && !helpOpen,
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
    tabValues,
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
        queuePath={queue_path}
        onTrack={track}
        onShowHelp={() => setHelpOpen(true)}
        notesCount={notes.length}
        onToggleNotes={() => setActiveTab('notes')}
        flagged={project.flagged_for_review}
        onFlag={() => setFlagOpen(true)}
        canFlag={!requirementsOnly}
        commitsUrl={project.commits_url}
        demoUrl={demoUrl}
      />

      {project.self_review && (
        <div className="rounded-md border border-red-600/50 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-700 dark:text-red-300">
          This is your own project. You cannot approve it
        </div>
      )}

      {project.flagged_for_review && (
        <FlagBanner
          reason={project.flag_reason}
          flaggedBy={project.flagged_by_name}
          canUnflag={can.unflag}
          onUnflag={unflag}
          unflagging={unflagging}
        />
      )}
      {claim.locked_by && !requirementsOnly ? (
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
          ) : requirementsOnly ? (
            <RequirementsPanel
              project={project}
              checks={checks}
              onToggleCheck={toggleCheck}
              checklistComplete={checklistComplete}
              feedback={feedback}
              setFeedback={setFeedback}
              submitting={submitting}
              canClaim={can.claim}
              invalidField={invalidField}
              onSubmit={(decision) => {
                if (decision === 'return' && !feedback.trim()) {
                  focusFeedback()
                  flash('feedback')
                  return
                }
                if (decision === 'requirements_met' && !checklistComplete) {
                  focusChecklist()
                  return
                }
                submit(decision)
              }}
            />
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
                  technicalFeatures,
                  setTechnicalFeatures,
                  additionalJustification,
                  setAdditionalJustification,
                  feedback,
                  setFeedback,
                  submitting,
                }}
                deflations={deflations}
                onDeflationChange={setDeflation}
                approvedHours={approvedHours}
                checks={checks}
                onToggleCheck={toggleCheck}
                claimedHours={claimedHours}
                deflation={deflation}
                previewCoins={previewCoins}
                justificationPreview={justificationPreview}
                lintIssues={lintIssues}
                aiAudit={justificationAudit}
                aiAuditing={justificationAuditing}
                onRunAiAudit={runJustificationAudit}
                duplicateAcknowledgement={duplicateAcknowledgement}
                setDuplicateAcknowledgement={setDuplicateAcknowledgement}
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
