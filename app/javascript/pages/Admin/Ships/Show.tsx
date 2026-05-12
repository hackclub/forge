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
  Globe,
  User as UserIcon,
  Clock,
  ChevronDown,
  Loader2,
  Star,
  StickyNote,
  ScrollText,
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
import { cn } from '@/components/admin/lib/cn'
import type {
  AdminShipDetail,
  AdminShipDevlog,
  AdminShipProjectContext,
  AdminShipSibling,
  ProjectNote,
} from '@/types'

function isSafeUrl(url: string | null | undefined): url is string {
  if (!url) return false
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

function formatHours(seconds: number | null): string {
  if (seconds == null) return '—'
  return `${(seconds / 3600).toFixed(1)}h`
}

function statusBadge(status: AdminShipDetail['status']) {
  switch (status) {
    case 'approved':
      return <Badge variant="success">Approved</Badge>
    case 'returned':
      return <Badge variant="warning">Returned</Badge>
    case 'rejected':
      return <Badge variant="destructive">Rejected</Badge>
    default:
      return <Badge variant="secondary">Pending</Badge>
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
        const stored = localStorage.getItem(`ship-review:${storageKey}`)
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
          localStorage.setItem(`ship-review:${storageKey}`, next ? '1' : '0')
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

export default function AdminShipsShow({
  ship,
  project,
  devlogs,
  notes,
  siblings,
  next_pending_id,
  can,
}: {
  ship: AdminShipDetail
  project: AdminShipProjectContext
  devlogs: AdminShipDevlog[]
  notes: ProjectNote[]
  siblings: AdminShipSibling[]
  next_pending_id: number | null
  can: { review: boolean }
}) {
  const isTerminal = ship.status !== 'pending'

  const [reasoning, setReasoning] = useState('')
  const [feedback, setFeedback] = useState(ship.feedback || '')
  const [approvedHoursInput, setApprovedHoursInput] = useState(
    ship.approved_seconds != null ? String((ship.approved_seconds / 3600).toFixed(1)) : project.total_hours.toFixed(1),
  )
  const [submitting, setSubmitting] = useState<null | 'approve' | 'return' | 'reject'>(null)

  const claimedHours = project.total_hours
  const approvedHours = useMemo(() => {
    const v = parseFloat(approvedHoursInput)
    return Number.isFinite(v) ? Math.max(0, Math.min(v, claimedHours)) : claimedHours
  }, [approvedHoursInput, claimedHours])
  const deflation = Math.max(0, claimedHours - approvedHours)
  const coinsEarned = useMemo(() => Math.round(approvedHours * project.coin_rate * 100) / 100, [approvedHours, project.coin_rate])

  const submit = useCallback(
    (decision: 'approve' | 'return' | 'reject') => {
      let payload: Record<string, string | number | null>
      if (decision === 'approve') {
        if (!reasoning.trim()) {
          alert('Reasoning is required when approving — this fills the {review_justification} block of the template.')
          return
        }
        payload = {
          decision,
          reasoning: reasoning.trim(),
          approved_hours: approvedHours,
          feedback: feedback.trim() || null,
        }
      } else {
        if (!feedback.trim()) {
          alert('Feedback is required when returning or rejecting a ship.')
          return
        }
        payload = { decision, feedback: feedback.trim() }
      }
      setSubmitting(decision)
      router.post(`/admin/ships/${ship.id}/review`, payload, {
        onFinish: () => setSubmitting(null),
      })
    },
    [ship.id, reasoning, feedback, approvedHours],
  )

  return (
    <div className="h-screen flex flex-col overflow-hidden border-t-2 border-orange-500">
      <div className="z-40 bg-card/40 border-b border-border px-4 py-2 flex items-center gap-3 shrink-0">
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/ships">
            <ArrowLeft className="size-4" />
            End Session
          </Link>
        </Button>
        {next_pending_id && (
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/admin/ships/${next_pending_id}`}>Skip</Link>
          </Button>
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
        {statusBadge(ship.status)}

        <div className="flex items-center gap-2 ml-auto">
          <Button variant="outline" size="sm" asChild>
            <a href={`/admin/users/${project.user_id}`} target="_blank" rel="noopener noreferrer">
              <UserIcon className="size-4" />
              See User
            </a>
          </Button>
          {isSafeUrl(project.repo_link) && (
            <Button variant="outline" size="sm" asChild>
              <a href={project.repo_link!} target="_blank" rel="noopener noreferrer">
                <GitBranch className="size-4" />
                Repo
              </a>
            </Button>
          )}
          {isSafeUrl(ship.frozen_demo_link) && (
            <Button variant="outline" size="sm" asChild>
              <a href={ship.frozen_demo_link!} target="_blank" rel="noopener noreferrer">
                <Globe className="size-4" />
                Demo
              </a>
            </Button>
          )}
          <Button variant="outline" size="sm" asChild>
            <a href={`/projects/${project.id}`} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="size-4" />
              Public Page
            </a>
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2 flex-wrap">
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
                    <span>{project.tier.replace('_', ' ')}</span>
                    <span>·</span>
                    <span>started {project.created_at}</span>
                    {project.tags.length > 0 && (
                      <>
                        <span>·</span>
                        <span>{project.tags.join(', ')}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 divide-x divide-border border-t border-border">
              <div className="px-3 py-2">
                <p className="text-xs text-muted-foreground mb-0.5">Hours Claimed</p>
                <p className="text-sm font-mono">{claimedHours.toFixed(1)}h</p>
              </div>
              <div className="px-3 py-2">
                <p className="text-xs text-muted-foreground mb-0.5">Project Status</p>
                <p className="text-sm capitalize">{project.status.replace('_', ' ')}</p>
              </div>
              <div className="px-3 py-2">
                <p className="text-xs text-muted-foreground mb-0.5">Devlogs</p>
                <p className="text-sm font-mono">{devlogs.length}</p>
              </div>
              <div className="px-3 py-2">
                <p className="text-xs text-muted-foreground mb-0.5">Coin Rate</p>
                <p className="text-sm font-mono">{project.coin_rate}/hr</p>
              </div>
            </div>

            {project.override_hours_justification && (
              <div className="px-4 py-2 border-t border-border text-xs">
                <span className="text-muted-foreground">Project override note: </span>
                <span>{project.override_hours_justification}</span>
              </div>
            )}

            {siblings.length > 0 && (
              <div className="px-4 py-2 border-t border-border flex items-center gap-2 text-xs flex-wrap">
                <span className="text-muted-foreground">Other ships:</span>
                {siblings.map((s) => (
                  <Link
                    key={s.id}
                    href={`/admin/ships/${s.id}`}
                    className="inline-flex items-center gap-1 hover:underline"
                  >
                    <span className="text-muted-foreground">{s.created_at}</span>
                    {statusBadge(s.status)}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {project.description && (
            <CollapsibleSection title="Description" storageKey="description" defaultOpen={false}>
              <div className="p-3 text-sm whitespace-pre-wrap text-muted-foreground leading-relaxed">
                {project.description}
              </div>
            </CollapsibleSection>
          )}

          {notes.length > 0 && (
            <CollapsibleSection
              title="Internal Notes"
              summary={`${notes.length} note${notes.length === 1 ? '' : 's'}`}
              storageKey="notes"
              defaultOpen={false}
            >
              <div className="divide-y divide-border">
                {notes.map((note) => (
                  <div key={note.id} className="p-3 flex gap-2">
                    <img src={note.author_avatar} alt="" className="size-5 rounded-full mt-0.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs text-muted-foreground">
                        <strong className="text-foreground">{note.author_name}</strong> · {note.created_at}
                      </div>
                      <p className="text-sm whitespace-pre-wrap mt-1">{note.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CollapsibleSection>
          )}

          <CollapsibleSection
            title="Devlogs / Journal"
            summary={
              devlogs.length > 0 ? (
                <>
                  Count: {devlogs.length} · Total:{' '}
                  {devlogs.reduce((s, d) => s + (d.time_hours || 0), 0).toFixed(1)}h
                </>
              ) : (
                'No devlogs yet'
              )
            }
            storageKey="devlogs"
            defaultOpen
          >
            {devlogs.length === 0 ? (
              <p className="text-sm text-muted-foreground p-3">This project has no devlog entries yet.</p>
            ) : (
              <div className="divide-y divide-border">
                {devlogs.map((entry) => (
                  <div key={entry.id} className="p-3 space-y-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                      <span className="font-medium text-foreground">{entry.title}</span>
                      <span>·</span>
                      <span>{entry.created_at}</span>
                      {entry.time_spent && (
                        <>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <Clock className="size-3" />
                            {entry.time_spent}
                          </span>
                        </>
                      )}
                      {!entry.meets_requirements && <Badge variant="warning">Does not meet requirements</Badge>}
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
          </CollapsibleSection>

          {ship.justification && (
            <CollapsibleSection title="Existing Justification" storageKey="justification" defaultOpen={false}>
              <pre className="p-3 text-xs whitespace-pre-wrap font-mono leading-relaxed">{ship.justification}</pre>
            </CollapsibleSection>
          )}
        </div>

        <div className="w-px shrink-0 bg-border" />

        <div className="w-96 shrink-0 overflow-y-auto p-4 space-y-4">
          {isTerminal ? (
            <>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Review Complete</h3>
              <div className="flex items-center gap-2">
                {statusBadge(ship.status)}
                {ship.reviewer_display_name && (
                  <span className="text-xs text-muted-foreground">by {ship.reviewer_display_name}</span>
                )}
              </div>

              {ship.feedback && (
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground uppercase tracking-wide">Feedback to builder</label>
                  <p className="text-sm whitespace-pre-wrap rounded-md border border-border bg-muted/30 p-2">
                    {ship.feedback}
                  </p>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground uppercase tracking-wide">Approved Hours</label>
                <p className="text-sm font-mono">{formatHours(ship.approved_seconds)}</p>
              </div>

              {next_pending_id && (
                <Button asChild className="w-full">
                  <Link href={`/admin/ships/${next_pending_id}`}>
                    Next pending ship
                    <ChevronDown className="size-4 -rotate-90" />
                  </Link>
                </Button>
              )}
            </>
          ) : (
            <>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Submit Review</h3>

              <div className="space-y-2">
                <label className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <ScrollText className="size-3.5" />
                  Reasoning <span className="text-muted-foreground/60">(fills the justification template)</span>
                </label>
                <Textarea
                  value={reasoning}
                  onChange={(e) => setReasoning(e.target.value)}
                  placeholder="Why does this ship meet the standards of the Unified DB?"
                  className="h-24 text-sm"
                />
                <p className="text-[11px] text-muted-foreground leading-snug">
                  On approval the server wraps this text with the Forge justification template — ship name, iteration,
                  reviewer, hours deflated and the admin link are filled in automatically.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <StickyNote className="size-3.5" />
                  Feedback to builder <span className="text-muted-foreground/60">(required to return/reject)</span>
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
                <label className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Clock className="size-3.5" />
                  Approved Hours
                </label>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground font-mono">{claimedHours.toFixed(1)}h</span>
                  <span className="text-muted-foreground">→</span>
                  <Input
                    type="number"
                    step="0.1"
                    min={0}
                    max={claimedHours}
                    value={approvedHoursInput}
                    onChange={(e) => setApprovedHoursInput(e.target.value)}
                    className="h-8 w-24 font-mono text-center"
                  />
                  <span className="text-muted-foreground">→</span>
                  <span
                    className={cn(
                      'font-mono',
                      approvedHours < claimedHours ? 'text-amber-600 dark:text-amber-400 font-semibold' : 'text-muted-foreground',
                    )}
                  >
                    {approvedHours.toFixed(1)}h
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                  <span>
                    Deflation: <span className="font-mono text-foreground">{deflation.toFixed(1)}h</span>
                  </span>
                  <span>
                    Coins: <span className="font-mono text-foreground">{coinsEarned.toFixed(2)}</span>
                  </span>
                </div>
              </div>

              <Separator />

              <div className="space-y-2 pt-1">
                <Button
                  className="w-full"
                  disabled={submitting !== null || !can.review}
                  onClick={() => submit('approve')}
                >
                  {submitting === 'approve' ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                  Approve
                </Button>

                <Button
                  variant="outline"
                  className="w-full"
                  disabled={submitting !== null || !can.review}
                  onClick={() => submit('return')}
                >
                  {submitting === 'return' ? <Loader2 className="size-4 animate-spin" /> : <Undo2 className="size-4" />}
                  Return (Needs Changes)
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full" disabled={submitting !== null || !can.review}>
                      <X className="size-4" />
                      Reject
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Reject this ship?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Rejection is for ships that should not be paid out at all (e.g. fraud, not a hardware project).
                        Use Return for ships that just need changes.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction variant="destructive" onClick={() => submit('reject')}>
                        Reject Ship
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>

              <p className="text-[10px] text-muted-foreground flex items-center gap-1 leading-snug">
                <Star className="size-3" />
                Final reviewer Aarav + Souptik will be referenced automatically in the templated justification.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

AdminShipsShow.layout = (page: ReactNode) => <ReviewLayout>{page}</ReviewLayout>
