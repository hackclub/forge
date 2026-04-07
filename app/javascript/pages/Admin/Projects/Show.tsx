import { useState } from 'react'
import { Link, router } from '@inertiajs/react'
import Markdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import remarkGfm from 'remark-gfm'
import type { AdminProjectDetail, ProjectStatus } from '@/types'

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
  build_pending: { label: 'Build Under Review', bg: 'bg-amber-500/10', text: 'text-amber-400', icon: 'engineering' },
  build_approved: { label: 'Build Approved', bg: 'bg-emerald-500/10', text: 'text-emerald-400', icon: 'verified' },
}

export default function AdminProjectsShow({
  project,
  ships,
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
  can: { review: boolean; destroy: boolean; restore: boolean }
}) {
  const [feedback, setFeedback] = useState('')
  const [hcbLink, setHcbLink] = useState(project.hcb_grant_link || '')
  const [overrideHours, setOverrideHours] = useState<string>(project.override_hours != null ? String(project.override_hours) : '')
  const [overrideJustification, setOverrideJustification] = useState(project.override_hours_justification || '')
  const status = statusConfig[project.status] || statusConfig.draft
  const isBuildReview = project.status === 'build_pending'

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

  function submitReview(decision: string) {
    if (decision !== 'approve' && !feedback.trim()) {
      alert('Please provide feedback when returning or rejecting a project.')
      return
    }
    router.post(`/admin/projects/${project.id}/review`, { decision, feedback })
  }

  return (
    <div className="p-12 max-w-[1400px] mx-auto">
      <Link href="/admin/projects" className="text-stone-500 text-sm hover:text-[#ffb595] transition-colors flex items-center gap-1 mb-8">
        <span className="material-symbols-outlined text-sm">arrow_back</span>
        Back to projects
      </Link>

      <div className="grid grid-cols-12 gap-12">
        <div className="col-span-12 lg:col-span-8">
          <div className="flex items-center gap-3 mb-4">
            <span className={`${status.bg} ${status.text} px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-widest flex items-center gap-1.5`}>
              <span className="material-symbols-outlined text-sm">{status.icon}</span>
              {status.label}
            </span>
            {project.is_discarded && (
              <span className="bg-red-500/10 text-red-400 px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-widest">
                Deleted {project.discarded_at}
              </span>
            )}
          </div>

          <h1 className="text-5xl font-headline font-bold text-[#e5e2e1] tracking-tighter mb-4">{project.name}</h1>

          {project.subtitle && (
            <p className="text-lg text-stone-400 leading-relaxed mb-4">{project.subtitle}</p>
          )}

          <p className="text-stone-400 text-sm mb-8">
            by{' '}
            <Link href={`/admin/users/${project.user_id}`} className="text-[#ffb595] hover:underline">
              {project.user_display_name}
            </Link>
            {' · '}Created {project.created_at}
            {project.tier === 'advanced' && (
              <span className="ml-2 bg-[#ee671c]/15 text-[#ee671c] px-2 py-0.5 text-[10px] uppercase font-bold tracking-widest">
                Advanced{project.budget ? ` · ${project.budget}` : ''}
              </span>
            )}
            {project.slack_url ? (
              <a href={project.slack_url} target="_blank" rel="noopener noreferrer" className="ml-2 bg-[#4A154B]/20 text-[#E01E5A] px-2 py-0.5 text-[10px] uppercase font-bold tracking-widest hover:bg-[#4A154B]/30 transition-colors inline-flex items-center gap-1">
                Slack Pitch
                <span className="material-symbols-outlined text-[10px]">open_in_new</span>
              </a>
            ) : project.from_slack ? (
              <span className="ml-2 bg-[#4A154B]/20 text-[#E01E5A] px-2 py-0.5 text-[10px] uppercase font-bold tracking-widest">
                Slack Pitch
              </span>
            ) : null}
          </p>

          {project.pitch_text && (
            <div className="bg-[#1c1b1b] ghost-border rounded-xl p-8 mb-8">
              <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-stone-500 font-headline mb-4">Original Pitch</h4>
              <div className="prose prose-invert prose-sm max-w-none text-stone-300 prose-a:text-[#ffb595] break-words [overflow-wrap:anywhere]">
                <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                  {project.pitch_text.replace(/<(https?:\/\/[^|>]+)\|([^>]+)>/g, '[$2]($1)').replace(/<(https?:\/\/[^>]+)>/g, '$1')}
                </Markdown>
              </div>
            </div>
          )}

          {project.description && (
            <div className="bg-[#1c1b1b] ghost-border rounded-xl p-8 mb-8">
              <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-stone-500 font-headline mb-4">Description</h4>
              <p className="text-stone-300 leading-relaxed">{project.description}</p>
            </div>
          )}

          {(isBuildReview || project.status === 'build_approved' || (project.tier === 'normal' && project.devlogs.length > 0)) && (
            <>
              {project.cover_image_url && (
                <div className="bg-[#1c1b1b] ghost-border rounded-xl p-8 mb-8">
                  <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-stone-500 font-headline mb-4">Cover Image</h4>
                  <img src={project.cover_image_url} alt="Project cover" className="max-w-full" />
                </div>
              )}

              <div className="bg-[#1c1b1b] ghost-border rounded-xl p-8 mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-stone-500 font-headline">README</h4>
                  <div className="flex items-center gap-3">
                    {project.readme_fetched_at && (
                      <span className="text-stone-600 text-[10px] uppercase tracking-wider">Fetched {project.readme_fetched_at}</span>
                    )}
                    <button
                      onClick={() => router.post(`/admin/projects/${project.id}/review`, { decision: 'refresh_readme' })}
                      className="ghost-border bg-[#0e0e0e] hover:bg-[#2a2a2a] text-stone-400 hover:text-[#ffb595] px-3 py-1.5 text-[10px] uppercase tracking-[0.15em] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">sync</span>
                      Refresh
                    </button>
                  </div>
                </div>
                {project.readme_cache ? (
                  <div className="prose prose-invert prose-sm max-w-none text-stone-300 prose-a:text-[#ffb595] prose-img:max-w-full overflow-x-auto">
                    <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>{project.readme_cache}</Markdown>
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
                  <span className="text-[#ffb595] text-sm font-bold">
                    Total: {project.total_hours}h
                    {project.override_hours != null && <span className="text-stone-500 text-xs ml-2">(overridden)</span>}
                  </span>
                </div>
                {project.devlogs.length > 0 ? (
                  <div className="space-y-4">
                    {project.devlogs.map((entry) => (
                      <div key={entry.id} className="bg-[#0e0e0e] p-5 ghost-border overflow-hidden">
                        <div className="flex items-start justify-between mb-2">
                          <h5 className="font-headline font-bold text-[#e5e2e1] break-words min-w-0">{entry.title}</h5>
                          <div className="flex items-center gap-3 text-xs">
                            {entry.time_spent && (
                              <span className="text-[#ffb595] flex items-center gap-1">
                                <span className="material-symbols-outlined text-xs">schedule</span>
                                {entry.time_spent}
                              </span>
                            )}
                            <span className="text-stone-500">{entry.created_at}</span>
                          </div>
                        </div>
                        <div className="prose prose-invert prose-sm max-w-none text-stone-300 prose-a:text-[#ffb595] break-words [overflow-wrap:anywhere]">
                          <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>{entry.content}</Markdown>
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

          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="bg-[#1c1b1b] ghost-border rounded-xl p-6">
              <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-stone-500 font-headline mb-3">Repository</h4>
              {isSafeUrl(project.repo_link) ? (
                <a href={project.repo_link!} target="_blank" rel="noopener" className="text-[#ffb595] hover:underline text-sm flex items-center gap-1">
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
                    <span key={tag} className="px-2 py-1 bg-[#0e0e0e] text-[10px] rounded text-stone-400 uppercase tracking-wider">
                      {tag}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-stone-600 text-sm">No tags</p>
              )}
            </div>
          </div>

          {project.review_feedback && (
            <div className="bg-[#1c1b1b] ghost-border rounded-xl p-8 mb-8">
              <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-stone-500 font-headline mb-3">
                Previous Review Feedback
                {project.reviewer_display_name && (
                  <span className="text-stone-600 normal-case tracking-normal font-normal"> by {project.reviewer_display_name} on {project.reviewed_at}</span>
                )}
              </h4>
              <p className="text-stone-300 text-sm leading-relaxed">{project.review_feedback}</p>
            </div>
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

          {can.review && !isBuildReview && (
            <div className="bg-[#1c1b1b] ghost-border p-8 rounded-xl">
              <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-amber-400 font-headline mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">rate_review</span>
                {project.status === 'pending' ? 'Review Pitch' : 'Change Status'}
              </h4>

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
                <button
                  onClick={() => submitReview('approve')}
                  className="w-full py-3 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 font-headline font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg">check_circle</span>
                  Approve
                </button>
                <button
                  onClick={() => submitReview('return')}
                  className="w-full py-3 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 font-headline font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg">undo</span>
                  Return for Changes
                </button>
                <button
                  onClick={() => submitReview('reject')}
                  className="w-full py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-headline font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg">cancel</span>
                  Reject
                </button>
                <button
                  onClick={() => submitReview('draft')}
                  className="w-full py-3 bg-stone-500/20 hover:bg-stone-500/30 text-stone-400 font-headline font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg">edit_note</span>
                  Revert to Draft
                </button>
              </div>
            </div>
          )}

          {can.review && project.status === 'build_pending' && (
            <div className="bg-[#1c1b1b] ghost-border p-8 rounded-xl">
              <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-amber-400 font-headline mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">engineering</span>
                Review Project
              </h4>

              <div className="mb-4">
                <label className="block text-xs font-bold uppercase tracking-[0.2em] text-stone-500 mb-2">
                  Override Hours
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={overrideHours}
                  onChange={(e) => setOverrideHours(e.target.value)}
                  className="w-full bg-[#0e0e0e] border-none px-4 py-3 text-[#e5e2e1] text-sm focus:ring-1 focus:ring-[#ee671c]/30 placeholder:text-stone-600"
                  placeholder={`Claimed: ${project.total_hours}h`}
                />
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

              <div className="mb-4">
                <label className="block text-xs font-bold uppercase tracking-[0.2em] text-stone-500 mb-2">
                  HCB Grant Link
                </label>
                <input
                  type="url"
                  value={hcbLink}
                  onChange={(e) => setHcbLink(e.target.value)}
                  className="w-full bg-[#0e0e0e] border-none px-4 py-3 text-[#e5e2e1] text-sm focus:ring-1 focus:ring-[#ee671c]/30 placeholder:text-stone-600"
                  placeholder="https://hcb.hackclub.com/..."
                />
              </div>

              <button
                onClick={() => router.post(`/admin/projects/${project.id}/review`, { decision: 'save_review_notes', override_hours: overrideHours, override_hours_justification: overrideJustification, hcb_grant_link: hcbLink })}
                className="w-full mb-4 py-2 ghost-border bg-[#0e0e0e] hover:bg-[#2a2a2a] text-stone-400 hover:text-[#ffb595] text-xs uppercase tracking-wider font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <span className="material-symbols-outlined text-sm">save</span>
                Save Notes
              </button>

              <div className="mb-6">
                <label className="block text-xs font-bold uppercase tracking-[0.2em] text-stone-500 mb-2">
                  Feedback
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={4}
                  className="w-full bg-[#0e0e0e] border-none px-4 py-3 text-[#e5e2e1] text-sm focus:ring-1 focus:ring-[#ee671c]/30 placeholder:text-stone-600 resize-y"
                  placeholder="Feedback for the builder..."
                />
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => router.post(`/admin/projects/${project.id}/review`, { decision: 'approve_build', feedback, hcb_grant_link: hcbLink, override_hours: overrideHours, override_hours_justification: overrideJustification })}
                  className="w-full py-3 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 font-headline font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg">verified</span>
                  Approve Build
                </button>
                <button
                  onClick={() => router.post(`/admin/projects/${project.id}/review`, { decision: 'return_build', feedback })}
                  className="w-full py-3 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 font-headline font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg">undo</span>
                  Return for More Work
                </button>
                <button
                  onClick={() => router.post(`/admin/projects/${project.id}/review`, { decision: 'reject_build', feedback })}
                  className="w-full py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-headline font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg">cancel</span>
                  Reject Build
                </button>
              </div>
            </div>
          )}

          <div className="bg-[#1c1b1b] ghost-border p-8 rounded-xl">
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-stone-500 font-headline mb-4">Visibility</h4>
            <div className="flex items-center justify-between mb-2">
              <span className="text-stone-400 text-sm">Hidden from explore</span>
              <button
                onClick={() => router.post(`/admin/projects/${project.id}/toggle_hidden`)}
                className={`relative inline-flex h-6 w-11 items-center transition-colors cursor-pointer ${project.hidden ? 'bg-[#ee671c]' : 'bg-stone-700'}`}
              >
                <span className={`inline-block h-4 w-4 transform bg-white transition-transform ${project.hidden ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            {project.hidden && (
              <p className="text-stone-600 text-xs">This project won't appear on the explore page or public API.</p>
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
              <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400 font-headline mb-2">Restore</h4>
              <p className="text-stone-500 text-sm mb-4">This project is soft-deleted. Restore it to make it active again.</p>
              <button
                onClick={handleRestore}
                className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/30 hover:text-emerald-300 px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] transition-colors cursor-pointer flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">restore</span>
                Restore Project
              </button>
            </div>
          )}

          {can.destroy && (
            <div className="border border-red-500/20 p-6">
              <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-red-400 font-headline mb-2">Danger Zone</h4>
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
        </aside>
      </div>
    </div>
  )
}
