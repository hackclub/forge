import { useMemo, useState } from 'react'
import { Link, router, usePage } from '@inertiajs/react'
import Markdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize from 'rehype-sanitize'
import remarkGfm from 'remark-gfm'
import type { AdminProjectDetail, ProjectStatus, SharedProps } from '@/types'
import ReviewTimeline, { type ReviewEvent } from '@/components/ReviewTimeline'

function isSafeUrl(url: string | null): boolean {
  if (!url) return false
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

const statusConfig: Record<ProjectStatus, { label: string; bg: string; text: string; icon: string }> = {
  draft: { label: 'Draft', bg: 'bg-stone-500/10', text: 'text-stone-400', icon: 'edit_note' },
  pending: { label: 'Pending Review', bg: 'bg-amber-500/10', text: 'text-amber-400', icon: 'schedule' },
  approved: { label: 'Approved', bg: 'bg-emerald-500/10', text: 'text-emerald-400', icon: 'check_circle' },
  returned: { label: 'Returned', bg: 'bg-orange-500/10', text: 'text-orange-400', icon: 'undo' },
  rejected: { label: 'Rejected', bg: 'bg-red-500/10', text: 'text-red-400', icon: 'cancel' },
  pitch_approved: { label: 'Pitch Approved', bg: 'bg-emerald-500/10', text: 'text-emerald-400', icon: 'check_circle' },
  pitch_pending: { label: 'Pitch Under Review', bg: 'bg-amber-500/10', text: 'text-amber-400', icon: 'schedule' },
}

export default function AdminProjectsShow({
  project,
  ships,
  notes,
  review_history,
  can,
}: {
  project: AdminProjectDetail
  ships: {
    id: number
    status: string
    reviewer_display_name: string | null
    approved_seconds: number | null
    created_at: string
  }[]
  notes: {
    id: number
    content: string
    author_name: string
    author_avatar: string
    created_at: string
  }[]
  review_history: ReviewEvent[]
  can: { review: boolean; destroy: boolean; restore: boolean }
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
  const isProjectReview = project.status === 'pending'

  function handleRestore() {
    if (!confirm(`Restore "${project.name}"?`)) return
    router.post(`/admin/projects/${project.id}/restore`)
  }

  function handleDelete() {
    const msg = project.is_discarded
      ? `Are you sure you want to PERMANENTLY destroy "${project.name}"? This cannot be undone.`
      : `Are you sure you want to delete "${project.name}"? This will soft-delete the project.`
    if (!confirm(msg)) return
    router.delete(`/admin/projects/${project.id}`)
  }

  const [reviewing, setReviewing] = useState(false)
  const [devlogOrder, setDevlogOrder] = useState<'newest' | 'oldest'>('newest')

  const sortedDevlogs = useMemo(() => {
    return [...project.devlogs].sort((a, b) => {
      const aTime = Date.parse(a.created_at)
      const bTime = Date.parse(b.created_at)
      const aSort = Number.isNaN(aTime) ? a.id : aTime
      const bSort = Number.isNaN(bTime) ? b.id : bTime
      return devlogOrder === 'newest' ? bSort - aSort : aSort - bSort
    })
  }, [project.devlogs, devlogOrder])

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
      {
        onFinish: () => setReviewing(false),
      },
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

  return (
    <div className="p-5 md:p-12 max-w-[1400px] mx-auto">
      <Link
        href="/admin/projects"
        className="text-stone-500 text-sm hover:text-[#ffb595] transition-colors flex items-center gap-1 mb-8"
      >
        <span className="material-symbols-outlined text-sm">arrow_back</span>
        Back to projects
      </Link>

      <div className="mb-6 flex justify-end">
        <Link
          href={`/projects/${project.id}`}
          className="ghost-border bg-[#1c1b1b] hover:bg-[#2a2a2a] text-stone-400 hover:text-[#ffb595] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.15em] inline-flex items-center gap-2 transition-colors"
        >
          <span className="material-symbols-outlined text-sm">visibility</span>
          View Public Page
        </Link>
      </div>

      <div className="grid grid-cols-12 gap-12">
        <div className="col-span-12 lg:col-span-8">
          <header className="mb-10 ghost-border bg-[#1c1b1b] overflow-hidden">
            {project.cover_image_url && (
              <div>
                <img src={project.cover_image_url} alt={project.name} className="w-full max-h-[320px] object-cover" />
              </div>
            )}
            <div className="p-8">
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <span
                  className={`${status.bg} ${status.text} px-3 py-1 text-[10px] uppercase font-bold tracking-widest flex items-center gap-1.5`}
                >
                  <span className="material-symbols-outlined text-sm">{status.icon}</span>
                  {status.label}
                </span>
                <span className="bg-[#353534] text-stone-400 px-3 py-1 text-[10px] uppercase font-bold tracking-widest">
                  {project.tier.replace('_', ' ')}
                  {project.budget ? ` · ${project.budget}` : ''}
                </span>
                {project.is_discarded && (
                  <span className="bg-red-500/10 text-red-400 px-3 py-1 text-[10px] uppercase font-bold tracking-widest">
                    Deleted {project.discarded_at}
                  </span>
                )}
                {project.slack_url ? (
                  <a
                    href={project.slack_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-[#4A154B]/20 text-[#E01E5A] px-3 py-1 text-[10px] uppercase font-bold tracking-widest hover:bg-[#4A154B]/30 transition-colors inline-flex items-center gap-1"
                  >
                    Slack Pitch
                    <span className="material-symbols-outlined text-[10px]">open_in_new</span>
                  </a>
                ) : project.from_slack ? (
                  <span className="bg-[#4A154B]/20 text-[#E01E5A] px-3 py-1 text-[10px] uppercase font-bold tracking-widest">
                    Slack Pitch
                  </span>
                ) : null}
              </div>

              <h1 className="text-5xl font-headline font-bold text-[#e5e2e1] tracking-tight mb-3 leading-none">
                {project.name}
              </h1>

              {project.subtitle && (
                <p className="text-lg text-stone-400 leading-relaxed max-w-2xl mb-4">{project.subtitle}</p>
              )}

              <div className="flex flex-wrap items-center gap-3 pt-5 border-t border-white/5 text-sm text-stone-400">
                <span>
                  by{' '}
                  <Link href={`/admin/users/${project.user_id}`} className="text-[#ffb595] hover:underline">
                    {project.user_display_name}
                  </Link>
                </span>
                <span>Started {project.created_at}</span>
              </div>
            </div>
          </header>

          {project.pitch_text && (
            <div className="bg-[#1c1b1b] ghost-border rounded-xl p-8 mb-8">
              <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-stone-500 font-headline mb-4">
                Original Pitch
              </h4>
              <div className="prose prose-invert prose-sm max-w-none text-stone-300 prose-a:text-[#ffb595] break-words [overflow-wrap:anywhere]">
                <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw, rehypeSanitize]}>
                  {project.pitch_text
                    .replace(/<(https?:\/\/[^|>]+)\|([^>]+)>/g, '[$2]($1)')
                    .replace(/<(https?:\/\/[^>]+)>/g, '$1')}
                </Markdown>
              </div>
            </div>
          )}

          {project.description && (
            <div className="bg-[#1c1b1b] ghost-border rounded-xl p-8 mb-8">
              <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-stone-500 font-headline mb-4">
                Description
              </h4>
              <p className="text-stone-300 leading-relaxed">{project.description}</p>
            </div>
          )}

          {(project.green_flags?.length > 0 || project.red_flags?.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div className="bg-[#1c1b1b] ghost-border rounded-xl p-6">
                <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400 font-headline mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  Green Flags
                </h4>
                {project.green_flags?.length > 0 ? (
                  <ul className="space-y-2">
                    {project.green_flags.map((flag, i) => (
                      <li key={i} className="text-stone-300 text-sm flex gap-2 leading-relaxed">
                        <span className="text-emerald-400 mt-0.5">+</span>
                        <span>{flag}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-stone-600 text-sm italic">None identified.</p>
                )}
              </div>

              <div className="bg-[#1c1b1b] ghost-border rounded-xl p-6">
                <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-red-400 font-headline mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">warning</span>
                  Red Flags
                </h4>
                {project.red_flags?.length > 0 ? (
                  <ul className="space-y-2">
                    {project.red_flags.map((flag, i) => (
                      <li key={i} className="text-stone-300 text-sm flex gap-2 leading-relaxed">
                        <span className="text-red-400 mt-0.5">!</span>
                        <span>{flag}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-stone-600 text-sm italic">None identified.</p>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="bg-[#1c1b1b] ghost-border rounded-xl p-6">
              <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-stone-500 font-headline mb-3">
                Repository
              </h4>
              {isSafeUrl(project.repo_link) ? (
                <a
                  href={project.repo_link!}
                  target="_blank"
                  rel="noopener"
                  className="text-[#ffb595] hover:underline text-sm flex items-center gap-1"
                >
                  {project.repo_link}
                  <span className="material-symbols-outlined text-sm">open_in_new</span>
                </a>
              ) : (
                <p className="text-stone-600 text-sm">No repository linked</p>
              )}
            </div>
            <div className="bg-[#1c1b1b] ghost-border rounded-xl p-6">
              <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-stone-500 font-headline mb-3">Tags</h4>
              {project.tags.length > 0 ? (
                <div className="flex gap-2 flex-wrap">
                  {project.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-[#0e0e0e] text-[10px] rounded text-stone-400 uppercase tracking-wider"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-stone-600 text-sm">No tags</p>
              )}
            </div>
          </div>

          <div className="bg-[#1c1b1b] ghost-border rounded-xl p-8 mb-8">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-stone-500 font-headline">
                  Internal Notes
                </h4>
                <p className="text-stone-600 text-xs mt-1">Visible only to staff in the admin view.</p>
              </div>
            </div>

            <div className="mb-5">
              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                rows={3}
                className="w-full bg-[#0e0e0e] border-none px-4 py-3 text-[#e5e2e1] text-sm focus:ring-1 focus:ring-[#ee671c]/30 placeholder:text-stone-600 resize-y"
                placeholder="Add an internal note..."
              />
              <button
                onClick={addNote}
                disabled={!noteContent.trim()}
                className="signature-smolder text-[#4c1a00] px-5 py-2 mt-3 text-xs font-bold uppercase tracking-[0.15em] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Note
              </button>
            </div>

            {notes.length > 0 ? (
              <div className="space-y-2">
                {notes.map((note) => (
                  <div key={note.id} className="bg-[#0e0e0e] ghost-border px-5 py-4 flex gap-3">
                    <img
                      src={note.author_avatar}
                      alt={note.author_name}
                      className="w-8 h-8 border border-white/10 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-headline font-bold text-[#e5e2e1] text-sm">{note.author_name}</span>
                        <span className="text-stone-600 text-xs">{note.created_at}</span>
                      </div>
                      <p className="text-stone-300 text-sm whitespace-pre-wrap">{note.content}</p>
                    </div>
                    <button
                      onClick={() => deleteNote(note.id)}
                      className="text-stone-600 hover:text-red-400 transition-colors shrink-0 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-stone-600 text-sm">No internal notes yet.</p>
            )}
          </div>

          <ReviewTimeline events={review_history} defaultExpanded />

          {(project.devlogs.length > 0 ||
            isProjectReview ||
            project.status === 'approved' ||
            project.status === 'pitch_approved') && (
            <>
              <div className="bg-[#1c1b1b] ghost-border rounded-xl p-8 mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-stone-500 font-headline">README</h4>
                  <div className="flex items-center gap-3">
                    {project.readme_fetched_at && (
                      <span className="text-stone-600 text-[10px] uppercase tracking-wider">
                        Fetched {project.readme_fetched_at}
                      </span>
                    )}
                    <button
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
                      className="ghost-border bg-[#0e0e0e] hover:bg-[#2a2a2a] text-stone-400 hover:text-[#ffb595] disabled:opacity-50 disabled:cursor-not-allowed px-3 py-1.5 text-[10px] uppercase tracking-[0.15em] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <span className={`material-symbols-outlined text-sm ${refreshingReadme ? 'animate-spin' : ''}`}>
                        sync
                      </span>
                      {refreshingReadme ? 'Fetching...' : 'Refresh'}
                    </button>
                  </div>
                </div>
                {project.readme_cache ? (
                  <div className="prose prose-invert prose-sm max-w-none text-stone-300 prose-a:text-[#ffb595] prose-img:max-w-full overflow-x-auto">
                    <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw, rehypeSanitize]}>
                      {project.readme_cache}
                    </Markdown>
                  </div>
                ) : (
                  <p className="text-stone-600 text-sm">No README fetched yet. Click Refresh to pull from the repo.</p>
                )}
              </div>

              <div className="bg-[#1c1b1b] ghost-border rounded-xl p-8 mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-stone-500 font-headline">
                    Devlogs ({project.devlogs.length})
                  </h4>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 bg-[#0e0e0e] ghost-border p-1">
                      <button
                        onClick={() => setDevlogOrder('newest')}
                        className={`px-2 py-1 text-[10px] uppercase tracking-[0.15em] font-bold transition-colors cursor-pointer ${devlogOrder === 'newest' ? 'text-[#ffb595]' : 'text-stone-500 hover:text-stone-300'}`}
                      >
                        Newest
                      </button>
                      <button
                        onClick={() => setDevlogOrder('oldest')}
                        className={`px-2 py-1 text-[10px] uppercase tracking-[0.15em] font-bold transition-colors cursor-pointer ${devlogOrder === 'oldest' ? 'text-[#ffb595]' : 'text-stone-500 hover:text-stone-300'}`}
                      >
                        Oldest
                      </button>
                    </div>
                    <span className="text-[#ffb595] text-sm font-bold">
                      Total: {project.total_hours}h
                      {project.override_hours != null && (
                        <span className="text-stone-500 text-xs ml-2">(overridden)</span>
                      )}
                    </span>
                  </div>
                </div>
                {project.devlogs.length > 0 ? (
                  <div className="space-y-4">
                    {sortedDevlogs.map((entry) => (
                      <div key={entry.id} className="bg-[#0e0e0e] p-5 ghost-border overflow-hidden">
                        {entry.time_hours === null && entry.time_spent && (
                          <div className="bg-amber-900/30 border border-amber-600/50 rounded-none p-3 mb-4 flex items-start gap-2">
                            <span className="material-symbols-outlined text-amber-500 text-lg shrink-0 mt-0.5">warning</span>
                            <div className="text-xs text-amber-100/90">
                              <p className="font-semibold mb-1">Time entry couldn't be parsed</p>
                              <p>The time spent (&quot;<span className="text-amber-300">{entry.time_spent}</span>&quot;) wasn't automatically parsed. Builder should edit to use a clearer format like &quot;3 hours&quot;, &quot;3h 15m&quot;, or &quot;3:15&quot;.</p>
                            </div>
                          </div>
                        )}
                        <div className="flex items-start justify-between mb-2 gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <h5 className="font-headline font-bold text-[#e5e2e1] break-words min-w-0">
                                {entry.title}
                              </h5>
                            </div>
                            <div className="flex items-center gap-3 text-xs flex-wrap">
                              {entry.time_spent && (
                                <span className="text-[#ffb595] flex items-center gap-1">
                                  <span className="material-symbols-outlined text-xs">schedule</span>
                                  {entry.time_spent}
                                </span>
                              )}
                              <span className="text-stone-500">{entry.created_at}</span>
                            </div>
                          </div>
                        </div>
                        <div className="prose prose-invert prose-sm max-w-none text-stone-300 prose-a:text-[#ffb595] break-words [overflow-wrap:anywhere]">
                          <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw, rehypeSanitize]}>
                            {entry.content}
                          </Markdown>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-stone-600 text-sm">No devlog entries yet.</p>
                )}
              </div>
            </>
          )}

          {ships.length > 0 && (
            <div>
              <h2 className="text-xl font-headline font-bold text-[#e5e2e1] mb-4">Ships ({ships.length})</h2>
              <div className="space-y-2">
                {ships.map((ship) => (
                  <Link
                    key={ship.id}
                    href={`/admin/reviews/${ship.id}`}
                    className="block bg-[#1c1b1b] ghost-border rounded-lg p-4 hover:bg-[#2a2a2a] transition-colors"
                  >
                    <div className="flex items-center justify-between text-sm">
                      <span className="capitalize text-stone-300">{ship.status}</span>
                      <span className="text-stone-500">{ship.created_at}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        <aside className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-[#1c1b1b] ghost-border p-8 rounded-xl">
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-stone-500 font-headline mb-4">Status</h4>
            <div className="flex items-center gap-2 mb-4">
              <span className={`material-symbols-outlined ${status.text}`}>{status.icon}</span>
              <span className={`font-headline font-bold ${status.text}`}>{status.label}</span>
            </div>
            {project.reviewer_display_name && (
              <p className="text-stone-500 text-sm">
                Reviewed by {project.reviewer_display_name} on {project.reviewed_at}
              </p>
            )}
          </div>

          {can.review && (
            <div className="bg-[#1c1b1b] ghost-border p-8 rounded-xl">
              <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-amber-400 font-headline mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">rate_review</span>
                {isPitchReview ? 'Review Pitch' : isProjectReview ? 'Review Project' : 'Change Status'}
              </h4>

              {isProjectReview && (
                <>
                  <div className="mb-4">
                    <label className="block text-xs font-bold uppercase tracking-[0.2em] text-stone-500 mb-2">
                      Override Hours
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max={project.devlog_hours}
                      value={overrideHours}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value)
                        if (!isNaN(v) && v > project.devlog_hours) {
                          setOverrideHours(String(project.devlog_hours))
                        } else {
                          setOverrideHours(e.target.value)
                        }
                      }}
                      className="w-full bg-[#0e0e0e] border-none px-4 py-3 text-[#e5e2e1] text-sm focus:ring-1 focus:ring-[#ee671c]/30 placeholder:text-stone-600"
                      placeholder={`Claimed: ${project.devlog_hours}h`}
                    />
                    <p className="text-stone-600 text-[10px] uppercase tracking-[0.15em] mt-1">
                      Max {project.devlog_hours}h (devlog total). Can only decrease, never increase.
                    </p>
                  </div>

                  <div className="mb-4">
                    <label className="block text-xs font-bold uppercase tracking-[0.2em] text-stone-500 mb-2">
                      Override Justification
                    </label>
                    <textarea
                      value={overrideJustification}
                      onChange={(e) => setOverrideJustification(e.target.value)}
                      rows={3}
                      className="w-full bg-[#0e0e0e] border-none px-4 py-3 text-[#e5e2e1] text-sm focus:ring-1 focus:ring-[#ee671c]/30 placeholder:text-stone-600 resize-y"
                      placeholder="Why was the hour count adjusted?"
                    />
                  </div>

                  <button
                    onClick={() => {
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
                      router.post(`/admin/projects/${project.id}/review`, {
                        decision: 'save_review_notes',
                        override_hours: overrideHours,
                        override_hours_justification: overrideJustification,
                      })
                    }}
                    className="w-full mb-4 py-2 ghost-border bg-[#0e0e0e] hover:bg-[#2a2a2a] text-stone-400 hover:text-[#ffb595] text-xs uppercase tracking-wider font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">save</span>
                    Save Notes
                  </button>
                </>
              )}

              <div className="mb-6">
                <label className="block text-xs font-bold uppercase tracking-[0.2em] text-stone-500 mb-2">
                  Feedback
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={4}
                  className="w-full bg-[#0e0e0e] border-none px-4 py-3 text-[#e5e2e1] text-sm focus:ring-1 focus:ring-[#ee671c]/30 placeholder:text-stone-600 resize-y"
                  placeholder="Provide feedback to the builder..."
                />
              </div>

              <div className="flex flex-col gap-3">
                {(isPitchReview || isProjectReview) && (
                  <>
                    <button
                      onClick={() =>
                        submitReview(
                          'approve',
                          isProjectReview
                            ? { override_hours: overrideHours, override_hours_justification: overrideJustification }
                            : {},
                        )
                      }
                      disabled={reviewing}
                      className="w-full py-3 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 font-headline font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="material-symbols-outlined text-lg">
                        {isProjectReview ? 'verified' : 'check_circle'}
                      </span>
                      {isProjectReview ? 'Approve Project' : 'Approve Pitch'}
                    </button>
                    <button
                      onClick={() => submitReview('return')}
                      disabled={reviewing}
                      className="w-full py-3 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 font-headline font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="material-symbols-outlined text-lg">undo</span>
                      Return for Changes
                    </button>
                    <button
                      onClick={() => submitReview('reject')}
                      disabled={reviewing}
                      className="w-full py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-headline font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="material-symbols-outlined text-lg">cancel</span>
                      Reject
                    </button>
                  </>
                )}
                {!isPitchReview && !isProjectReview && (
                  <button
                    onClick={() => submitReview('draft')}
                    className="w-full py-3 bg-stone-500/20 hover:bg-stone-500/30 text-stone-400 font-headline font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-lg">edit_note</span>
                    Revert to Draft
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="bg-[#1c1b1b] ghost-border p-8 rounded-xl">
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-stone-500 font-headline mb-4">Tier</h4>
            <select
              value={project.tier}
              onChange={(e) => {
                if (
                  e.target.value !== project.tier &&
                  confirm(`Change tier from ${project.tier.replace('_', ' ')} to ${e.target.value.replace('_', ' ')}?`)
                ) {
                  router.post(`/admin/projects/${project.id}/change_tier`, { tier: e.target.value })
                }
              }}
              className="w-full bg-[#0e0e0e] border-none px-4 py-3 text-[#e5e2e1] text-sm focus:ring-1 focus:ring-[#ee671c]/30 cursor-pointer"
            >
              <option value="tier_4">Tier 4 - 4c/hr</option>
              <option value="tier_3">Tier 3 - 4.5c/hr</option>
              <option value="tier_2">Tier 2 - 5.5c/hr</option>
              <option value="tier_1">Tier 1 - 7c/hr</option>
            </select>
            {project.from_slack && project.tier !== 'tier_1' && (
              <p className="text-amber-400/70 text-xs mt-2 flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">info</span>
                Originally a Slack pitch - tier was changed by staff.
              </p>
            )}
          </div>

          <div className="bg-[#1c1b1b] ghost-border p-8 rounded-xl">
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-stone-500 font-headline mb-4">
              Visibility
            </h4>
            <div className="flex items-center justify-between mb-2">
              <span className="text-stone-400 text-sm">Hidden from explore</span>
              <button
                onClick={() => router.post(`/admin/projects/${project.id}/toggle_hidden`)}
                className={`relative inline-flex h-6 w-11 items-center transition-colors cursor-pointer ${project.hidden ? 'bg-[#ee671c]' : 'bg-stone-700'}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform bg-white transition-transform ${project.hidden ? 'translate-x-6' : 'translate-x-1'}`}
                />
              </button>
            </div>
            {project.hidden && (
              <p className="text-stone-600 text-xs mb-4">
                This project won't appear on the explore page or public API.
              </p>
            )}

            <div className="flex items-center justify-between mt-4 mb-2">
              <span className="text-stone-400 text-sm">Staff pick</span>
              <button
                onClick={() => router.post(`/admin/projects/${project.id}/toggle_staff_pick`)}
                className={`relative inline-flex h-6 w-11 items-center transition-colors cursor-pointer ${project.staff_pick ? 'bg-[#ee671c]' : 'bg-stone-700'}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform bg-white transition-transform ${project.staff_pick ? 'translate-x-6' : 'translate-x-1'}`}
                />
              </button>
            </div>
            {project.staff_pick && (
              <p className="text-stone-600 text-xs">Featured under Staff Picks on the dashboard.</p>
            )}
          </div>

          <div className="bg-[#1c1b1b] ghost-border p-8 rounded-xl">
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-stone-500 font-headline mb-6">Details</h4>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-stone-500">Owner</span>
                <Link href={`/admin/users/${project.user_id}`} className="text-[#ffb595] hover:underline">
                  {project.user_display_name}
                </Link>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Created</span>
                <span className="text-[#e5e2e1]">{project.created_at}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Ships</span>
                <span className="text-[#e5e2e1]">{ships.length}</span>
              </div>
            </div>
          </div>

          {can.restore && (
            <div className="ghost-border bg-[#1c1b1b] p-6">
              <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400 font-headline mb-2">
                Restore
              </h4>
              <p className="text-stone-500 text-sm mb-4">
                This project is soft-deleted. Restore it to make it active again.
              </p>
              <button
                onClick={handleRestore}
                className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/30 hover:text-emerald-300 px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] transition-colors cursor-pointer flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">restore</span>
                Restore Project
              </button>
            </div>
          )}

          {can.destroy && (!project.is_discarded || isSuperadmin) && (
            <div className="border border-red-500/20 p-6">
              <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-red-400 font-headline mb-2">
                Danger Zone
              </h4>
              <p className="text-stone-500 text-sm mb-4">
                {project.is_discarded
                  ? 'This project is soft-deleted. You can permanently destroy it.'
                  : 'Soft-delete this project from active listings.'}
              </p>
              <button
                onClick={handleDelete}
                className="bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30 hover:text-red-300 px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] transition-colors cursor-pointer flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">delete_forever</span>
                {project.is_discarded ? 'Permanently Destroy' : 'Delete Project'}
              </button>
            </div>
          )}
          {can.destroy && project.is_discarded && !isSuperadmin && (
            <div className="border border-stone-500/20 p-6">
              <p className="text-stone-500 text-sm">
                This project is soft-deleted. Only a superadmin can permanently destroy it.
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
