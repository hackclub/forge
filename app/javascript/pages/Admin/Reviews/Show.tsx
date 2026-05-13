import { useCallback, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, router } from '@inertiajs/react'
import Markdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize from 'rehype-sanitize'
import remarkGfm from 'remark-gfm'
import {
  ArrowLeft,
  Check,
  X,
  Undo2,
  ExternalLink,
  GitBranch,
  User as UserIcon,
  Clock,
  ChevronDown,
  Loader2,
  StickyNote,
  ScrollText,
  ShieldAlert,
  FileEdit,
  History,
  RefreshCw,
  AlertCircle,
} from 'lucide-react'
import ReviewLayout from '@/layouts/ReviewLayout'
import { Badge } from '@/components/admin/ui/badge'
import { Button } from '@/components/admin/ui/button'
import { Input } from '@/components/admin/ui/input'
import { Textarea } from '@/components/admin/ui/textarea'
import { Separator } from '@/components/admin/ui/separator'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/admin/ui/alert-dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/admin/ui/tabs'
import { cn } from '@/components/admin/lib/cn'
import AdminReviewTimeline, { type ReviewEvent } from '@/components/admin/AdminReviewTimeline'
import { useReviewHeartbeat, formatSeconds } from '@/hooks/useReviewHeartbeat'
import { trackReviewEvent } from '@/lib/reviewTracker'
import { buildJustification, formatJustificationDate } from '@/lib/justificationPreview'
import type { ProjectStatus, ProjectTier } from '@/types'

interface ReviewProject {
  id: number
  name: string
  subtitle: string | null
  description: string | null
  red_flags: string[]
  green_flags: string[]
  repo_link: string | null
  tags: string[]
  status: ProjectStatus
  tier: ProjectTier
  budget: string | null
  coin_rate: number
  total_hours: number
  devlog_hours: number
  override_hours: number | null
  override_hours_justification: string | null
  cover_image_url: string | null
  pitch_text: string | null
  readme_cache: string | null
  readme_fetched_at: string | null
  reviewed_at: string | null
  reviewer_display_name: string | null
  review_feedback: string | null
  from_slack: boolean
  slack_url: string | null
  created_at: string
  created_at_iso: string
  user_id: number
  user_display_name: string
  user_email: string
  user_avatar: string
  coins_earned_preview: number
  devlogs: {
    id: number
    title: string
    content: string
    time_spent: string | null
    time_hours: number | null
    created_at: string
    meets_requirements: boolean
    validation: { content_length: number; has_image: boolean }
  }[]
}

interface ReviewSession {
  id: number
  active_seconds: number
  started_at: string
  heartbeat_path: string
}

interface SessionStats {
  sessions: {
    id: number
    reviewer_name: string
    active_seconds: number
    started_at: string
    ended_at: string | null
    decision: string | null
  }[]
  total_active_seconds: number
}

interface Reviewer {
  display_name: string
  email: string
  is_superadmin: boolean
}

interface ProjectNote {
  id: number
  content: string
  author_name: string
  author_avatar: string
  created_at: string
}

function isSafeUrl(url: string | null | undefined): url is string {
  if (!url) return false
  try {
    const p = new URL(url)
    return p.protocol === 'http:' || p.protocol === 'https:'
  } catch {
    return false
  }
}

function statusBadge(status: ProjectStatus) {
  switch (status) {
    case 'approved':
      return <Badge variant="success">Approved</Badge>
    case 'returned':
      return <Badge variant="warning">Returned</Badge>
    case 'rejected':
      return <Badge variant="destructive">Rejected</Badge>
    case 'pending':
      return <Badge variant="warning">Pending</Badge>
    case 'pitch_approved':
      return <Badge variant="success">Pitch Approved</Badge>
    case 'pitch_pending':
      return <Badge variant="warning">Pitch Pending</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

function CollapsibleSection({
  title,
  summary,
  defaultOpen = true,
  storageKey,
  children,
}: {
  title: string
  summary?: ReactNode
  defaultOpen?: boolean
  storageKey?: string
  children: ReactNode
}) {
  const [open, setOpen] = useState(() => {
    if (storageKey) {
      try {
        const stored = localStorage.getItem(`review:${storageKey}`)
        if (stored !== null) return stored === '1'
      } catch {}
    }
    return defaultOpen
  })
  const toggle = () =>
    setOpen((v) => {
      const next = !v
      if (storageKey) {
        try {
          localStorage.setItem(`review:${storageKey}`, next ? '1' : '0')
        } catch {}
      }
      return next
    })
  return (
    <div className="rounded-md border border-border overflow-hidden bg-card">
      <button
        type="button"
        onClick={toggle}
        className="w-full flex items-center gap-2 px-3 py-2 bg-muted/50 hover:bg-muted/80 transition-colors cursor-pointer text-left"
      >
        <span className="text-sm font-semibold shrink-0">{title}</span>
        {summary && <span className="text-xs text-muted-foreground flex-1 min-w-0 truncate">{summary}</span>}
        {!summary && <span className="flex-1" />}
        <ChevronDown className={cn('size-3.5 shrink-0 text-muted-foreground transition-transform', !open && '-rotate-90')} />
      </button>
      {open && <div>{children}</div>}
    </div>
  )
}

interface ConcurrentReviewer {
  reviewer_name: string
  reviewer_avatar: string
  started_at: string
  last_heartbeat_at: string | null
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
  session_stats,
}: {
  project: ReviewProject
  session: ReviewSession | null
  concurrent_reviewers: ConcurrentReviewer[]
  next_pending_id: number | null
  reviewer: Reviewer
  review_history: ReviewEvent[]
  notes: ProjectNote[]
  can: { review: boolean }
  session_stats: SessionStats | null
}) {
  const isTerminal = project.status !== 'pending'
  useReviewHeartbeat(session?.heartbeat_path ?? null, session?.active_seconds ?? 0)
  const [readmeRefreshing, setReadmeRefreshing] = useState(false)

  const track = useCallback(
    (button: string, metadata: Record<string, unknown> = {}) => {
      trackReviewEvent(project.id, button, metadata)
    },
    [project.id],
  )

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
  const [feedback, setFeedback] = useState('')
  const [overrideHours, setOverrideHours] = useState<string>(
    project.override_hours != null ? String(project.override_hours) : '',
  )
  const [overrideJustification, setOverrideJustification] = useState(project.override_hours_justification ?? '')
  const [submitting, setSubmitting] = useState<null | 'approve' | 'return' | 'reject' | 'draft'>(null)

  const claimedHours = project.devlog_hours
  const approvedHours = useMemo(() => {
    const v = parseFloat(overrideHours)
    if (overrideHours.trim() === '' || !Number.isFinite(v)) return claimedHours
    return Math.max(0, Math.min(v, claimedHours))
  }, [overrideHours, claimedHours])
  const deflation = Math.max(0, claimedHours - approvedHours)
  const previewCoins = Math.round(approvedHours * project.coin_rate * 100) / 100

  const justificationPreview = useMemo(
    () =>
      buildJustification({
        ship_name: project.name,
        submittion_time: formatJustificationDate(project.created_at_iso),
        project_approval_time: formatJustificationDate(new Date().toISOString()),
        reviewer_name: reviewer.display_name,
        reviewer_email: reviewer.email || null,
        claimed_hours: claimedHours,
        approved_hours: approvedHours,
        review_justification: reasoning,
        forge_admin_link: `${typeof window !== 'undefined' ? window.location.origin : 'https://forge.hackclub.com'}/admin/projects/${project.id}`,
      }),
    [project, reviewer, claimedHours, approvedHours, reasoning],
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

  const submit = useCallback(
    (decision: 'approve' | 'return' | 'reject' | 'draft') => {
      track(`${decision}_clicked`)
      const payload: Record<string, string | number | null> = { decision }
      if (decision === 'approve') {
        if (!reasoning.trim()) {
          alert('Reasoning is required when approving — it fills the {review_justification} block of the template.')
          return
        }
        payload.reasoning = reasoning.trim()
        payload.feedback = feedback.trim() || null
        if (overrideHours.trim() !== '') {
          payload.override_hours = overrideHours.trim()
          if (!overrideJustification.trim()) {
            alert('Provide an override justification when adjusting hours.')
            return
          }
          payload.override_hours_justification = overrideJustification.trim()
        }
      } else if (decision === 'draft') {
        payload.feedback = feedback.trim() || null
      } else {
        if (!feedback.trim()) {
          alert('Feedback to the builder is required when returning or rejecting.')
          return
        }
        payload.feedback = feedback.trim()
      }
      setSubmitting(decision)
      router.post(`/admin/projects/${project.id}/review`, payload, {
        onFinish: () => setSubmitting(null),
      })
    },
    [project.id, reasoning, feedback, overrideHours, overrideJustification, track],
  )

  return (
    <div className="h-screen flex flex-col overflow-hidden border-t-2 border-orange-500">
      <div className="z-40 bg-card/40 border-b border-border px-4 py-2 flex items-center gap-3 shrink-0 flex-wrap">
        <Button variant="outline" size="sm" asChild onClick={() => track('end_session')}>
          <Link href="/admin/reviews">
            <ArrowLeft className="size-4" />
            End Session
          </Link>
        </Button>
        {next_pending_id && (
          <Button variant="ghost" size="sm" asChild onClick={() => track('skip', { next_id: next_pending_id })}>
            <Link href={`/admin/reviews/${next_pending_id}`}>Skip</Link>
          </Button>
        )}

        {session && (
          <span
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"
            title="Your review session is active. Time is being recorded — refresh-safe, resumes the same session."
          >
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75 animate-ping" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
            </span>
            Session active
          </span>
        )}

        <Separator orientation="vertical" className="h-6" />

        <a
          href={`/admin/projects/${project.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold truncate hover:underline"
        >
          {project.name}
        </a>
        <span className="text-sm text-muted-foreground">
          by{' '}
          <a
            href={`/admin/users/${project.user_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline text-foreground"
          >
            {project.user_display_name}
          </a>
        </span>
        {statusBadge(project.status)}

        <div className="flex items-center gap-2 ml-auto">
          <Button variant="outline" size="sm" asChild onClick={() => track('open_user')}>
            <a href={`/admin/users/${project.user_id}`} target="_blank" rel="noopener noreferrer">
              <UserIcon className="size-4" />
              User
            </a>
          </Button>
          {isSafeUrl(project.repo_link) && (
            <Button variant="outline" size="sm" asChild onClick={() => track('open_repo', { url: project.repo_link })}>
              <a href={project.repo_link!} target="_blank" rel="noopener noreferrer">
                <GitBranch className="size-4" />
                Repo
              </a>
            </Button>
          )}
          <Button variant="outline" size="sm" asChild onClick={() => track('open_public')}>
            <a href={`/projects/${project.id}`} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="size-4" />
              Public
            </a>
          </Button>
        </div>
      </div>

      {concurrent_reviewers.length > 0 && (
        <div className="bg-amber-500/10 border-b border-amber-500/40 px-4 py-2 flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400 shrink-0">
          <AlertCircle className="size-4 shrink-0" />
          <span>
            {concurrent_reviewers.map((r) => r.reviewer_name).join(', ')}{' '}
            {concurrent_reviewers.length === 1 ? 'is' : 'are'} currently reviewing this project. Coordinate to avoid duplicate decisions.
          </span>
        </div>
      )}

      <div className="flex-1 min-h-0 flex">
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="rounded-md border border-border bg-card overflow-hidden">
            <div className="p-4 space-y-2">
              <div className="flex items-start gap-3">
                {project.cover_image_url && (
                  <img
                    src={project.cover_image_url}
                    alt=""
                    className="w-20 h-20 object-cover rounded-md border border-border shrink-0"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <h1 className="text-lg font-semibold leading-snug truncate">{project.name}</h1>
                  {project.subtitle && <p className="text-sm text-muted-foreground line-clamp-2">{project.subtitle}</p>}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1.5 flex-wrap">
                    <a
                      href={`/admin/users/${project.user_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-foreground hover:underline"
                    >
                      <img src={project.user_avatar} alt="" className="size-4 rounded-full" />
                      <span>{project.user_display_name}</span>
                    </a>
                    <span>·</span>
                    <a href={`mailto:${project.user_email}`} className="hover:underline text-foreground/80 font-mono">
                      {project.user_email}
                    </a>
                    <span>·</span>
                    <span>{project.tier.replace('_', ' ')}{project.budget ? ` · ${project.budget}` : ''}</span>
                    <span>·</span>
                    <span>started {project.created_at}</span>
                    {project.from_slack && project.slack_url && (
                      <>
                        <span>·</span>
                        <a href={project.slack_url} target="_blank" rel="noopener noreferrer" className="hover:underline text-foreground">
                          Slack pitch ↗
                        </a>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 divide-x divide-border border-t border-border">
              <div className="px-3 py-2">
                <p className="text-xs text-muted-foreground mb-0.5">Hours claimed</p>
                <p className="text-sm font-mono">{claimedHours.toFixed(1)}h</p>
              </div>
              <div className="px-3 py-2">
                <p className="text-xs text-muted-foreground mb-0.5">Coin rate</p>
                <p className="text-sm font-mono">{project.coin_rate}/hr</p>
              </div>
              <div className="px-3 py-2">
                <p className="text-xs text-muted-foreground mb-0.5">Devlogs</p>
                <p className="text-sm font-mono">{project.devlogs.length}</p>
              </div>
              <div className="px-3 py-2">
                <p className="text-xs text-muted-foreground mb-0.5">Coins (preview)</p>
                <p className="text-sm font-mono">{previewCoins.toFixed(2)}c</p>
              </div>
            </div>

            {project.override_hours_justification && (
              <div className="px-4 py-2 border-t border-border text-xs">
                <span className="text-muted-foreground">Existing override: </span>
                <span>{project.override_hours_justification}</span>
              </div>
            )}
          </div>

          {(project.green_flags.length > 0 || project.red_flags.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {project.green_flags.length > 0 && (
                <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-3">
                  <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide mb-1.5">Green flags</p>
                  <ul className="space-y-1 text-sm">
                    {project.green_flags.map((g, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-emerald-600 dark:text-emerald-400">+</span>
                        <span>{g}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {project.red_flags.length > 0 && (
                <div className="rounded-md border border-red-500/30 bg-red-500/5 p-3">
                  <p className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wide mb-1.5">Red flags</p>
                  <ul className="space-y-1 text-sm">
                    {project.red_flags.map((r, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-red-600 dark:text-red-400">!</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <Tabs defaultValue="journal" className="w-full">
            <TabsList>
              <TabsTrigger value="journal">Journal ({project.devlogs.length})</TabsTrigger>
              <TabsTrigger value="readme">README</TabsTrigger>
              <TabsTrigger value="pitch">Pitch</TabsTrigger>
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="notes">Notes ({notes.length})</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
            </TabsList>

            <TabsContent value="journal">
              {project.devlogs.length === 0 ? (
                <p className="text-sm text-muted-foreground p-3">No devlog entries yet.</p>
              ) : (
                <div className="space-y-2">
                  {project.devlogs.map((entry) => (
                    <div key={entry.id} className="rounded-md border border-border bg-card p-3 space-y-2">
                      <div className="flex items-center gap-2 text-xs flex-wrap">
                        <span className="font-semibold text-sm text-foreground">{entry.title}</span>
                        <span className="text-muted-foreground">·</span>
                        <span className="text-muted-foreground">{entry.created_at}</span>
                        {entry.time_spent && (
                          <>
                            <span className="text-muted-foreground">·</span>
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <Clock className="size-3" />
                              {entry.time_spent}
                              {entry.time_hours != null && <span className="font-mono">({entry.time_hours.toFixed(1)}h)</span>}
                            </span>
                          </>
                        )}
                        {!entry.meets_requirements && <Badge variant="warning">Below requirements</Badge>}
                      </div>
                      <div className="markdown-content text-sm">
                        <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw, rehypeSanitize]}>
                          {entry.content}
                        </Markdown>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="readme">
              {project.readme_cache ? (
                <div className="rounded-md border border-border bg-card p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-muted-foreground">Fetched {project.readme_fetched_at || '—'}</p>
                    <Button variant="outline" size="sm" disabled={readmeRefreshing} onClick={refreshReadme}>
                      <RefreshCw className={cn('size-3.5', readmeRefreshing && 'animate-spin')} />
                      {readmeRefreshing ? 'Fetching…' : 'Refresh'}
                    </Button>
                  </div>
                  <div className="markdown-content text-sm">
                    <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw, rehypeSanitize]}>
                      {project.readme_cache}
                    </Markdown>
                  </div>
                </div>
              ) : (
                <div className="rounded-md border border-border bg-card p-6 text-center space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {project.repo_link ? "No README cached yet — pull it now." : "No repository linked, so there's no README to fetch."}
                  </p>
                  {project.repo_link && (
                    <Button onClick={refreshReadme} disabled={readmeRefreshing}>
                      <RefreshCw className={cn('size-4', readmeRefreshing && 'animate-spin')} />
                      {readmeRefreshing ? 'Fetching…' : 'Cache README'}
                    </Button>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="pitch">
              {project.pitch_text ? (
                <div className="rounded-md border border-border bg-card p-3 markdown-content text-sm">
                  <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw, rehypeSanitize]}>
                    {project.pitch_text}
                  </Markdown>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground p-3">No pitch text on this project.</p>
              )}
            </TabsContent>

            <TabsContent value="description">
              {project.description ? (
                <div className="rounded-md border border-border bg-card p-3 text-sm whitespace-pre-wrap">{project.description}</div>
              ) : (
                <p className="text-sm text-muted-foreground p-3">No description.</p>
              )}
            </TabsContent>

            <TabsContent value="notes">
              {notes.length === 0 ? (
                <p className="text-sm text-muted-foreground p-3">No internal notes yet.</p>
              ) : (
                <div className="space-y-2">
                  {notes.map((note) => (
                    <div key={note.id} className="rounded-md border border-border bg-card p-3 flex gap-2">
                      <img src={note.author_avatar} alt="" className="size-6 rounded-full shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-muted-foreground">
                          <strong className="text-foreground">{note.author_name}</strong> · {note.created_at}
                        </div>
                        <p className="text-sm whitespace-pre-wrap mt-1">{note.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="timeline">
              {review_history.length === 0 ? (
                <p className="text-sm text-muted-foreground p-3">No timeline events yet.</p>
              ) : (
                <AdminReviewTimeline events={review_history} defaultExpanded />
              )}
            </TabsContent>
          </Tabs>

          {reviewer.is_superadmin && session_stats && session_stats.sessions.length > 0 && (
            <CollapsibleSection
              title="Reviewer time audit"
              summary={`${session_stats.sessions.length} session${session_stats.sessions.length === 1 ? '' : 's'} · ${formatSeconds(session_stats.total_active_seconds)} total`}
              storageKey="audit"
              defaultOpen={false}
            >
              <div className="px-3 py-2 text-xs text-muted-foreground border-b border-border bg-muted/30">
                Active review time recorded per reviewer for this project — the basis for reviewer payouts. Visible to superadmins only.
              </div>
              <div className="divide-y divide-border">
                {session_stats.sessions.map((s) => (
                  <div key={s.id} className="px-3 py-2 text-xs flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <UserIcon className="size-3.5 text-muted-foreground" />
                      <span className="font-medium">{s.reviewer_name}</span>
                      <span className="text-muted-foreground">{s.started_at}</span>
                      {s.ended_at && <span className="text-muted-foreground">→ {s.ended_at}</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono">{formatSeconds(s.active_seconds)}</span>
                      {s.decision && <Badge variant="outline">{s.decision}</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            </CollapsibleSection>
          )}
        </div>

        <div className="w-px shrink-0 bg-border" />

        <div className="w-[440px] shrink-0 overflow-y-auto p-4 space-y-4">
          {isTerminal ? (
            <ReadOnlyDecision project={project} next_pending_id={next_pending_id} />
          ) : (
            <>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Submit Review</h3>

              <div className="space-y-2">
                <label className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <ScrollText className="size-3.5" />
                  Reasoning <span className="text-muted-foreground/60">(wraps into justification template on approval)</span>
                </label>
                <Textarea
                  value={reasoning}
                  onChange={(e) => setReasoning(e.target.value)}
                  placeholder="Why does this project meet Forge standards? Anything notable about hours/quality?"
                  className="h-24 text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <StickyNote className="size-3.5" />
                  Feedback to builder <span className="text-muted-foreground/60">(required for return / reject)</span>
                </label>
                <Textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="What does the builder need to know?"
                  className="h-20 text-sm"
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Override tier</label>
                <select
                  value={project.tier}
                  onChange={(e) => changeTier(e.target.value)}
                  className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground cursor-pointer"
                >
                  <option value="tier_4">Tier 4 — 4c/hr</option>
                  <option value="tier_3">Tier 3 — 4.5c/hr</option>
                  <option value="tier_2">Tier 2 — 5.5c/hr</option>
                  <option value="tier_1">Tier 1 — 7c/hr</option>
                </select>
                {project.from_slack && project.tier !== 'tier_1' && (
                  <p className="text-amber-600 dark:text-amber-400 text-[11px]">
                    Originally a Slack pitch — tier was changed by staff.
                  </p>
                )}
              </div>

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
                    value={overrideJustification}
                    onChange={(e) => setOverrideJustification(e.target.value)}
                    placeholder="Why the deflation?"
                    className="h-8 text-sm"
                  />
                )}
              </div>

              <CollapsibleSection title="Justification preview" summary="What goes to the Unified DB" storageKey="preview" defaultOpen>
                <pre className="p-3 text-[11px] whitespace-pre-wrap font-mono leading-relaxed text-muted-foreground">
                  {justificationPreview}
                </pre>
              </CollapsibleSection>

              <div className="space-y-2 pt-1">
                <Button className="w-full" disabled={submitting !== null || !can.review} onClick={() => submit('approve')}>
                  {submitting === 'approve' ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                  Approve · {previewCoins.toFixed(2)}c
                </Button>
                <Button variant="outline" className="w-full" disabled={submitting !== null || !can.review} onClick={() => submit('return')}>
                  {submitting === 'return' ? <Loader2 className="size-4 animate-spin" /> : <Undo2 className="size-4" />}
                  Return (needs changes)
                </Button>
                <Button variant="ghost" className="w-full" disabled={submitting !== null || !can.review} onClick={() => submit('draft')}>
                  <FileEdit className="size-4" />
                  Send back to Draft
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      className="w-full"
                      disabled={submitting !== null || !can.review}
                      onClick={() => track('reject_open')}
                    >
                      <X className="size-4" />
                      Reject
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Reject project?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Rejection means no payout at all. Use Return for projects that need changes.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel onClick={() => track('reject_cancel')}>Cancel</AlertDialogCancel>
                      <AlertDialogAction variant="destructive" onClick={() => submit('reject')}>
                        Reject
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function ReadOnlyDecision({ project, next_pending_id }: { project: ReviewProject; next_pending_id: number | null }) {
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
          <p className="text-sm whitespace-pre-wrap rounded-md border border-border bg-muted/30 p-2">{project.review_feedback}</p>
        </div>
      )}
      <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-700 dark:text-amber-400 flex gap-2">
        <ShieldAlert className="size-4 shrink-0 mt-0.5" />
        <span>This project is no longer pending. To undo a review use "Reverse Review" on the project admin page.</span>
      </div>
      <div className="flex gap-2">
        <Button asChild variant="outline" className="flex-1" onClick={() => trackReviewEvent(project.id, 'view_project')}>
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

AdminReviewsShow.layout = (page: ReactNode) => <ReviewLayout>{page}</ReviewLayout>
