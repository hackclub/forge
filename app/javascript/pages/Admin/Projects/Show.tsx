import { useMemo, useState } from 'react'
import { Link, router, usePage } from '@inertiajs/react'
import Markdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize from 'rehype-sanitize'
import remarkGfm from 'remark-gfm'
import {
  ArrowLeft,
  ExternalLink,
  CheckCircle2,
  Undo2,
  XCircle,
  ShieldCheck,
  FileEdit,
  RefreshCw,
  Clock,
  Save,
  Trash2,
  RotateCcw,
  X as XIcon,
  AlertTriangle,
  Database,
} from 'lucide-react'
import { Badge } from '@/components/admin/ui/badge'
import { Button } from '@/components/admin/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/admin/ui/card'
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
import AdminReviewTimeline, { type ReviewEvent } from '@/components/admin/AdminReviewTimeline'
import { cn } from '@/components/admin/lib/cn'
import type { AdminProjectDetail, ProjectStatus, SharedProps } from '@/types'

function isSafeUrl(url: string | null): boolean {
  if (!url) return false
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

const statusConfig: Record<
  ProjectStatus,
  { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' | 'success' | 'warning' }
> = {
  draft: { label: 'Draft', variant: 'secondary' },
  pending: { label: 'Pending Review', variant: 'warning' },
  approved: { label: 'Approved', variant: 'success' },
  returned: { label: 'Returned', variant: 'warning' },
  rejected: { label: 'Rejected', variant: 'destructive' },
  pitch_approved: { label: 'Pitch Approved', variant: 'success' },
  pitch_pending: { label: 'Pitch Review', variant: 'warning' },
}

export default function AdminProjectsShow({
  project,
  notes,
  review_history,
  airtable_status,
  can,
}: {
  project: AdminProjectDetail
  notes: {
    id: number
    content: string
    author_name: string
    author_avatar: string
    created_at: string
  }[]
  review_history: ReviewEvent[]
  airtable_status: { in_airtable: boolean; record_id?: string; queue_status?: string }
  can: { review: boolean; destroy: boolean; restore: boolean; reverse: boolean }
}) {
  const isSuperadmin = !!usePage<SharedProps>().props.auth.user?.is_superadmin
  const [feedback, setFeedback] = useState('')
  const [noteContent, setNoteContent] = useState('')
  const [refreshingReadme, setRefreshingReadme] = useState(false)
  const [overrideHours, setOverrideHours] = useState<string>(
    project.override_hours != null ? String(project.override_hours) : '',
  )
  const [overrideJustification, setOverrideJustification] = useState(project.override_hours_justification || '')
  const status = statusConfig[project.status] || statusConfig.draft
  const isPitchReview = project.status === 'pitch_pending'
  const isBuildReview = project.build_review && project.status === 'pending'
  const isProjectReview = project.status === 'pending' && !project.build_review
  const [reviewing, setReviewing] = useState(false)
  const [devlogOrder, setDevlogOrder] = useState<'newest' | 'oldest'>('newest')

  const sortedDevlogs = useMemo(() => {
    return [...project.devlogs].sort((a, b) => (devlogOrder === 'newest' ? b.id - a.id : a.id - b.id))
  }, [project.devlogs, devlogOrder])

  function handleRestore() {
    if (!confirm(`Restore "${project.name}"?`)) return
    router.post(`/admin/projects/${project.id}/restore`)
  }

  function handleDelete() {
    const msg = project.is_discarded
      ? `Permanently destroy "${project.name}"? This cannot be undone.`
      : `Soft-delete "${project.name}"?`
    if (!confirm(msg)) return
    router.delete(`/admin/projects/${project.id}`)
  }

  function submitReview(decision: string, extra: Record<string, unknown> = {}) {
    if (reviewing) return
    if (decision !== 'approve' && decision !== 'draft' && !feedback.trim()) {
      alert('Please provide feedback when returning or rejecting a project.')
      return
    }
    if (overrideHours.trim() !== '') {
      const parsed = parseFloat(overrideHours)
      if (!isNaN(parsed) && parsed < 0) {
        alert('Override hours cannot be negative.')
        return
      }
      if (!overrideJustification.trim()) {
        alert('Please provide a justification when overriding hours.')
        return
      }
    }
    setReviewing(true)
    router.post(
      `/admin/projects/${project.id}/review`,
      { decision, feedback, ...extra },
      { onFinish: () => setReviewing(false) },
    )
  }

  function addNote() {
    if (!noteContent.trim()) return
    router.post(
      `/admin/projects/${project.id}/add_note`,
      { content: noteContent },
      {
        preserveScroll: true,
        onSuccess: () => setNoteContent(''),
      },
    )
  }

  function deleteNote(noteId: number) {
    if (!confirm('Delete this note?')) return
    router.delete(`/admin/projects/${project.id}/notes/${noteId}`, { preserveScroll: true })
  }

  function markUnbuilt() {
    if (!confirm(`Mark "${project.name}" as unbuilt? Clears build proof and date.`)) return
    router.post(`/admin/projects/${project.id}/mark_unbuilt`, {}, { preserveScroll: true })
  }

  const [reverseOpen, setReverseOpen] = useState(false)
  const [reverseReason, setReverseReason] = useState('')
  const [refundCoins, setRefundCoins] = useState(true)
  const [cancelAirtable, setCancelAirtable] = useState(true)
  const [notifySlack, setNotifySlack] = useState(false)
  const [reversing, setReversing] = useState(false)

  function submitReverseReview() {
    if (!reverseReason.trim()) {
      alert('Reason is required.')
      return
    }
    setReversing(true)
    router.post(
      `/admin/projects/${project.id}/reverse_review`,
      {
        reason: reverseReason.trim(),
        refund_coins: refundCoins,
        cancel_airtable: cancelAirtable,
        notify_slack: notifySlack,
      },
      {
        onFinish: () => {
          setReversing(false)
          setReverseOpen(false)
          setReverseReason('')
        },
      },
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/projects">
            <ArrowLeft className="size-4" />
            Back to projects
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/projects/${project.id}`}>
            <ExternalLink className="size-4" />
            View public page
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-8 space-y-4">
          <Card>
            {project.cover_image_url && (
              <img
                src={project.cover_image_url}
                alt={project.name}
                className="w-full max-h-80 object-cover rounded-t-lg"
              />
            )}
            <CardContent className="p-6 pt-6 space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={status.variant}>
                  {project.build_review && project.status === 'pending' ? 'Build Review' : status.label}
                </Badge>
                <Badge variant="outline">
                  {project.build_review ? 'Build Review' : project.tier.replace('_', ' ')}
                  {!project.build_review && project.budget ? ` · ${project.budget}` : ''}
                </Badge>
                {project.linked_project && (
                  <Link href={`/admin/projects/${project.linked_project.id}`}>
                    <Badge variant="outline" className="hover:bg-accent">
                      For: {project.linked_project.name}
                      <ExternalLink className="size-3" />
                    </Badge>
                  </Link>
                )}
                {project.is_discarded && <Badge variant="destructive">Deleted {project.discarded_at}</Badge>}
                {project.slack_url && (
                  <a href={project.slack_url} target="_blank" rel="noopener noreferrer">
                    <Badge variant="outline" className="hover:bg-accent">
                      Slack Pitch
                      <ExternalLink className="size-3" />
                    </Badge>
                  </a>
                )}
              </div>

              <h1 className="text-3xl font-semibold tracking-tight">{project.name}</h1>

              {project.subtitle && (
                <p className="text-base text-muted-foreground leading-relaxed">{project.subtitle}</p>
              )}

              <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-border text-sm text-muted-foreground">
                <span>
                  by{' '}
                  <Link href={`/admin/users/${project.user_id}`} className="text-foreground hover:underline">
                    {project.user_display_name}
                  </Link>
                </span>
                {project.members
                  .filter((m) => !m.is_owner)
                  .map((m) => (
                    <span key={m.user_id} className="flex items-center gap-1.5">
                      <span>+</span>
                      <Link
                        href={`/admin/users/${m.user_id}`}
                        className="flex items-center gap-1 text-foreground hover:underline"
                      >
                        <img src={m.avatar} alt="" className="size-4 rounded-full" />
                        {m.display_name}
                      </Link>
                    </span>
                  ))}
                <span>·</span>
                <span>Started {project.created_at}</span>
              </div>

              {project.payouts.length > 0 && (
                <div className="mt-3 rounded-md border border-border overflow-hidden">
                  <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground bg-muted/50">
                    Payout split
                  </p>
                  <table className="w-full text-xs">
                    <tbody>
                      {project.payouts.map((p) => (
                        <tr key={p.user_id} className="border-t border-border">
                          <td className="px-3 py-1.5">{p.display_name}</td>
                          <td className="px-3 py-1.5 text-right font-mono">{p.hours.toFixed(1)}h</td>
                          <td className="px-3 py-1.5 text-right font-mono text-muted-foreground">
                            ×{p.streak_multiplier?.toFixed(2) ?? '1.00'} streak · ×
                            {p.guild_multiplier?.toFixed(2) ?? '1.00'} guild
                          </td>
                          <td className="px-3 py-1.5 text-right font-mono">{p.coins.toFixed(2)}c</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {project.pitch_text && (
            <Card>
              <CardHeader>
                <CardTitle>Original Pitch</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="markdown-content">
                  <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw, rehypeSanitize]}>
                    {project.pitch_text
                      .replace(/<(https?:\/\/[^|>]+)\|([^>]+)>/g, '[$2]($1)')
                      .replace(/<(https?:\/\/[^>]+)>/g, '$1')}
                  </Markdown>
                </div>
              </CardContent>
            </Card>
          )}

          {project.description && (
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {project.description}
                </p>
              </CardContent>
            </Card>
          )}

          {(project.green_flags?.length > 0 || project.red_flags?.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                    <CheckCircle2 className="size-4" />
                    Green Flags
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {project.green_flags?.length > 0 ? (
                    <ul className="space-y-1.5">
                      {project.green_flags.map((flag, i) => (
                        <li key={i} className="text-sm leading-relaxed flex gap-2">
                          <span className="text-emerald-600 dark:text-emerald-400">+</span>
                          <span>{flag}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">None identified.</p>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-red-600 dark:text-red-400 flex items-center gap-2">
                    <AlertTriangle className="size-4" />
                    Red Flags
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {project.red_flags?.length > 0 ? (
                    <ul className="space-y-1.5">
                      {project.red_flags.map((flag, i) => (
                        <li key={i} className="text-sm leading-relaxed flex gap-2">
                          <span className="text-red-600 dark:text-red-400">!</span>
                          <span>{flag}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">None identified.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Repository</CardTitle>
              </CardHeader>
              <CardContent>
                {isSafeUrl(project.repo_link) ? (
                  <a
                    href={project.repo_link!}
                    target="_blank"
                    rel="noopener"
                    className="text-sm hover:underline inline-flex items-center gap-1 break-all"
                  >
                    {project.repo_link}
                    <ExternalLink className="size-3 shrink-0" />
                  </a>
                ) : (
                  <p className="text-sm text-muted-foreground">No repository linked</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Tags</CardTitle>
              </CardHeader>
              <CardContent>
                {project.tags.length > 0 ? (
                  <div className="flex gap-1.5 flex-wrap">
                    {project.tags.map((tag) => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No tags</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Internal Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Add an internal note…"
                className="min-h-20"
              />
              <Button onClick={addNote} disabled={!noteContent.trim()} size="sm">
                Add Note
              </Button>
              {notes.length > 0 ? (
                <div className="space-y-2 pt-2">
                  {notes.map((note) => (
                    <div key={note.id} className="rounded-md border border-border bg-background p-3 flex gap-2">
                      <img src={note.author_avatar} alt="" className="size-6 rounded-full shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          <span className="font-medium text-foreground">{note.author_name}</span>
                          <span>·</span>
                          <span>{note.created_at}</span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap mt-1">{note.content}</p>
                      </div>
                      <button
                        onClick={() => deleteNote(note.id)}
                        className="text-muted-foreground hover:text-destructive cursor-pointer"
                      >
                        <XIcon className="size-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No internal notes yet.</p>
              )}
            </CardContent>
          </Card>

          <AdminReviewTimeline events={review_history} defaultExpanded />

          {(project.devlogs.length > 0 ||
            isProjectReview ||
            project.status === 'approved' ||
            project.status === 'pitch_approved') && (
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>README</CardTitle>
                  <div className="flex items-center gap-2">
                    {project.readme_fetched_at && (
                      <span className="text-xs text-muted-foreground">Fetched {project.readme_fetched_at}</span>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={refreshingReadme}
                      onClick={() => {
                        setRefreshingReadme(true)
                        router.post(
                          `/admin/projects/${project.id}/review`,
                          { decision: 'refresh_readme' },
                          {
                            preserveScroll: true,
                            onFinish: () => {
                              setTimeout(() => {
                                router.reload({ only: ['project'], onFinish: () => setRefreshingReadme(false) })
                              }, 1500)
                            },
                          },
                        )
                      }}
                    >
                      <RefreshCw className={cn('size-3.5', refreshingReadme && 'animate-spin')} />
                      {refreshingReadme ? 'Fetching…' : 'Refresh'}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {project.readme_cache ? (
                    <div className="markdown-content">
                      <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw, rehypeSanitize]}>
                        {project.readme_cache}
                      </Markdown>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No README fetched yet.</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Devlogs ({project.devlogs.length})</CardTitle>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 rounded-md border border-border bg-background p-0.5">
                      {(['newest', 'oldest'] as const).map((order) => (
                        <button
                          key={order}
                          onClick={() => setDevlogOrder(order)}
                          className={cn(
                            'px-2 py-0.5 text-xs rounded-sm font-medium transition-colors cursor-pointer',
                            devlogOrder === order
                              ? 'bg-primary text-primary-foreground'
                              : 'text-muted-foreground hover:text-foreground',
                          )}
                        >
                          {order}
                        </button>
                      ))}
                    </div>
                    <span className="text-sm font-medium">
                      {project.total_hours}h
                      {project.override_hours != null && (
                        <span className="text-muted-foreground text-xs ml-1">(overridden)</span>
                      )}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {project.devlogs.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No devlog entries yet.</p>
                  ) : (
                    sortedDevlogs.map((entry) => (
                      <div key={entry.id} className="rounded-md border border-border bg-background p-4 space-y-2">
                        {entry.time_hours === null && entry.time_spent && (
                          <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-2 text-xs text-amber-700 dark:text-amber-400 flex gap-2">
                            <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                            <span>
                              Time entry "{entry.time_spent}" couldn't be parsed. Use "3 hours", "3h 15m" or "3:15".
                            </span>
                          </div>
                        )}
                        {!entry.meets_requirements && (
                          <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-2 text-xs text-amber-700 dark:text-amber-400">
                            <p className="font-bold">Entry doesn't meet requirements</p>
                            <ul className="space-y-0.5 mt-1 ml-4 list-disc">
                              {!entry.validation.meets_length_requirement && (
                                <li>{entry.validation.content_length}/100 chars of content</li>
                              )}
                              {!entry.validation.meets_image_requirement && (
                                <li>{entry.validation.has_image ? '✓' : '0'}/1 images</li>
                              )}
                            </ul>
                          </div>
                        )}
                        <div className="flex items-center gap-2 flex-wrap text-xs">
                          <h5 className="font-semibold text-sm text-foreground">{entry.title}</h5>
                          {entry.time_spent && (
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <Clock className="size-3" />
                              {entry.time_spent}
                            </span>
                          )}
                          {entry.lapse_url && (
                            <a
                              href={entry.lapse_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-foreground hover:underline"
                            >
                              <ExternalLink className="size-3" />
                              Lapse
                            </a>
                          )}
                          <span className="text-muted-foreground">· {entry.created_at}</span>
                        </div>
                        <div className="markdown-content text-sm">
                          <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw, rehypeSanitize]}>
                            {entry.content}
                          </Markdown>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>

        <aside className="col-span-12 lg:col-span-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Badge variant={status.variant}>{status.label}</Badge>
              {project.reviewer_display_name && (
                <p className="text-xs text-muted-foreground">
                  Reviewed by {project.reviewer_display_name} on {project.reviewed_at}
                </p>
              )}
              {airtable_status.in_airtable && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
                  <Database className="size-3.5" />
                  <span>
                    In Airtable: <span className="font-mono text-foreground">{airtable_status.record_id}</span>
                  </span>
                </div>
              )}
              {can.reverse && (
                <AlertDialog open={reverseOpen} onOpenChange={setReverseOpen}>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full mt-2">
                      <Undo2 className="size-4" />
                      Reverse Review
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="max-w-xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Reverse this review</AlertDialogTitle>
                      <AlertDialogDescription>
                        Project will return to <strong>pending</strong>. Choose what else to undo. The full action is
                        audited.
                      </AlertDialogDescription>
                    </AlertDialogHeader>

                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">Reason (required)</label>
                        <Textarea
                          value={reverseReason}
                          onChange={(e) => setReverseReason(e.target.value)}
                          placeholder="e.g. reviewer was project owner; conflict of interest"
                        />
                      </div>

                      <label className="flex items-start gap-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={refundCoins}
                          onChange={(e) => setRefundCoins(e.target.checked)}
                          className="mt-0.5"
                        />
                        <span>
                          Refund coins earned
                          <span className="text-xs text-muted-foreground block">
                            Creates a negative CoinAdjustment for {project.total_hours}h × tier rate × streak.
                          </span>
                        </span>
                      </label>

                      <label className="flex items-start gap-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={cancelAirtable}
                          onChange={(e) => setCancelAirtable(e.target.checked)}
                          className="mt-0.5"
                        />
                        <span>
                          Cancel Airtable queue items
                          {airtable_status.in_airtable && (
                            <span className="block mt-1 rounded-md border border-amber-500/40 bg-amber-500/10 p-2 text-xs text-amber-700 dark:text-amber-400 flex gap-1.5">
                              <AlertTriangle className="size-3.5 shrink-0 mt-0.5" />
                              <span>
                                Already in actual Airtable (record{' '}
                                <code className="font-mono">{airtable_status.record_id}</code>). Cancelling the queue
                                item won't remove it from the Airtable base — delete there manually.
                              </span>
                            </span>
                          )}
                        </span>
                      </label>

                      {project.tier === 'tier_1' && (
                        <label className="flex items-start gap-2 text-sm cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notifySlack}
                            onChange={(e) => setNotifySlack(e.target.checked)}
                            className="mt-0.5"
                          />
                          <span>
                            Notify the builder in Slack
                            <span className="text-xs text-muted-foreground block">
                              Only available for tier-1 projects with a Slack pitch.
                            </span>
                          </span>
                        </label>
                      )}
                    </div>

                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        variant="destructive"
                        disabled={reversing || !reverseReason.trim()}
                        onClick={submitReverseReview}
                      >
                        Reverse Review
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </CardContent>
          </Card>

          {can.review && isPitchReview && (
            <Card>
              <CardHeader>
                <CardTitle>Review Pitch</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Feedback</label>
                  <Textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Provide feedback to the builder…"
                    className="min-h-24"
                  />
                </div>
                <Separator />
                <div className="flex flex-col gap-2">
                  <Button onClick={() => submitReview('approve')} disabled={reviewing} className="w-full">
                    <CheckCircle2 className="size-4" />
                    Approve Pitch
                  </Button>
                  <Button
                    onClick={() => submitReview('return')}
                    disabled={reviewing}
                    variant="outline"
                    className="w-full"
                  >
                    <Undo2 className="size-4" />
                    Return for Changes
                  </Button>
                  <Button
                    onClick={() => submitReview('reject')}
                    disabled={reviewing}
                    variant="destructive"
                    className="w-full"
                  >
                    <XCircle className="size-4" />
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {can.review && !isPitchReview && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {isBuildReview ? 'Review Build Review' : isProjectReview ? 'Review Project' : 'Review Session'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {isBuildReview
                    ? `First build review${project.linked_project ? ` for ${project.linked_project.name}` : ' (no linked project)'}. Approving will mark the linked project as built.`
                    : isProjectReview
                      ? 'Open a review session for this project'
                      : 'This project has been reviewed. Open the session to inspect the recorded decision'}
                </p>
                <Button asChild className="w-full">
                  <Link href={`/admin/reviews/${project.id}`}>
                    <ShieldCheck className="size-4" />
                    {isProjectReview || isBuildReview ? 'Start Review Session' : 'Open Review Session'}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {!project.build_review && (
            <Card>
              <CardHeader>
                <CardTitle>Tier</CardTitle>
              </CardHeader>
              <CardContent>
                <select
                  value={project.tier}
                  onChange={(e) => {
                    if (
                      e.target.value !== project.tier &&
                      confirm(
                        `Change tier from ${project.tier.replace('_', ' ')} to ${e.target.value.replace('_', ' ')}?`,
                      )
                    ) {
                      router.post(`/admin/projects/${project.id}/change_tier`, { tier: e.target.value })
                    }
                  }}
                  className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground cursor-pointer"
                >
                  <option value="tier_4">Tier 4 - 5.0c/hr</option>
                  <option value="tier_3">Tier 3 - 5.5c/hr</option>
                  <option value="tier_2">Tier 2 - 6.5c/hr</option>
                  <option value="tier_1">Tier 1 - 7.5c/hr</option>
                </select>
                {project.from_slack && project.tier !== 'tier_1' && (
                  <p className="text-amber-600 dark:text-amber-400 text-xs mt-2">
                    Originally a Slack pitch — tier was changed by staff.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Visibility</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span>Hidden from explore</span>
                <button
                  onClick={() => router.post(`/admin/projects/${project.id}/toggle_hidden`)}
                  className={cn(
                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer',
                    project.hidden ? 'bg-primary' : 'bg-muted',
                  )}
                >
                  <span
                    className={cn(
                      'inline-block h-4 w-4 transform rounded-full bg-background transition-transform shadow',
                      project.hidden ? 'translate-x-6' : 'translate-x-1',
                    )}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div className="pr-3">
                  <span>Shadow ban</span>
                  <p className="text-xs text-muted-foreground">
                    Hides hours from metrics and leaderboard. Nothing else changes.
                  </p>
                </div>
                <button
                  onClick={() => router.post(`/admin/projects/${project.id}/toggle_shadow_ban`)}
                  className={cn(
                    'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors cursor-pointer',
                    project.shadow_banned ? 'bg-primary' : 'bg-muted',
                  )}
                >
                  <span
                    className={cn(
                      'inline-block h-4 w-4 transform rounded-full bg-background transition-transform shadow',
                      project.shadow_banned ? 'translate-x-6' : 'translate-x-1',
                    )}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span>Staff pick</span>
                <button
                  onClick={() => router.post(`/admin/projects/${project.id}/toggle_staff_pick`)}
                  className={cn(
                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer',
                    project.staff_pick ? 'bg-primary' : 'bg-muted',
                  )}
                >
                  <span
                    className={cn(
                      'inline-block h-4 w-4 transform rounded-full bg-background transition-transform shadow',
                      project.staff_pick ? 'translate-x-6' : 'translate-x-1',
                    )}
                  />
                </button>
              </div>
            </CardContent>
          </Card>

          {can.review && project.built_at && (
            <Card>
              <CardHeader>
                <CardTitle>Build Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">Marked as built on {project.built_at}.</p>
                {project.build_proof_url && (
                  <a
                    href={project.build_proof_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm hover:underline inline-flex items-center gap-1"
                  >
                    View build proof
                    <ExternalLink className="size-3" />
                  </a>
                )}
                <Button variant="outline" size="sm" onClick={markUnbuilt}>
                  <Undo2 className="size-4" />
                  Mark Unbuilt
                </Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Owner</span>
                <Link href={`/admin/users/${project.user_id}`} className="hover:underline">
                  {project.user_display_name}
                </Link>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>{project.created_at}</span>
              </div>
            </CardContent>
          </Card>

          {can.restore && (
            <Card className="border-emerald-500/40">
              <CardHeader>
                <CardTitle className="text-emerald-600 dark:text-emerald-400">Restore</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">This project is soft-deleted. Restore to reactivate.</p>
                <Button onClick={handleRestore} className="w-full">
                  <RotateCcw className="size-4" />
                  Restore Project
                </Button>
              </CardContent>
            </Card>
          )}

          {can.destroy && (!project.is_discarded || isSuperadmin) && (
            <Card className="border-destructive/40">
              <CardHeader>
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {project.is_discarded ? 'Permanently destroy this project.' : 'Soft-delete this project.'}
                </p>
                <Button onClick={handleDelete} variant="destructive" className="w-full">
                  <Trash2 className="size-4" />
                  {project.is_discarded ? 'Permanently Destroy' : 'Delete Project'}
                </Button>
              </CardContent>
            </Card>
          )}
          {can.destroy && project.is_discarded && !isSuperadmin && (
            <Card className="border-border">
              <CardContent className="p-4 text-sm text-muted-foreground">
                This project is soft-deleted. Only a superadmin can permanently destroy it.
              </CardContent>
            </Card>
          )}
        </aside>
      </div>
    </div>
  )
}
