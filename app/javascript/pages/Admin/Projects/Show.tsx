import { useState } from 'react'
import { Link, router } from '@inertiajs/react'
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
  const status = statusConfig[project.status] || statusConfig.draft

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
        {/* Main Content */}
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

          <p className="text-stone-400 text-sm mb-8">
            by{' '}
            <Link href={`/admin/users/${project.user_id}`} className="text-[#ffb595] hover:underline">
              {project.user_display_name}
            </Link>
            {' · '}Created {project.created_at}
            {project.from_slack && (
              <span className="ml-2 bg-[#4A154B]/20 text-[#E01E5A] px-2 py-0.5 text-[10px] uppercase font-bold tracking-widest">
                Slack Pitch
              </span>
            )}
          </p>

          {project.pitch_text && (
            <div className="bg-[#1c1b1b] ghost-border rounded-xl p-8 mb-8">
              <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-stone-500 font-headline mb-4">Original Pitch</h4>
              <pre className="text-stone-300 text-sm leading-relaxed whitespace-pre-wrap font-sans">{project.pitch_text}</pre>
            </div>
          )}

          {project.description && (
            <div className="bg-[#1c1b1b] ghost-border rounded-xl p-8 mb-8">
              <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-stone-500 font-headline mb-4">Description</h4>
              <p className="text-stone-300 leading-relaxed">{project.description}</p>
            </div>
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

          {/* Previous review feedback */}
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

          {/* Ships */}
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

        {/* Sidebar — Review Panel */}
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
                {project.status === 'pending' ? 'Review Project' : 'Change Status'}
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
                {project.status !== 'approved' && (
                  <button
                    onClick={() => submitReview('approve')}
                    className="w-full py-3 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 font-headline font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-lg">check_circle</span>
                    Approve
                  </button>
                )}
                {project.status !== 'returned' && (
                  <button
                    onClick={() => submitReview('return')}
                    className="w-full py-3 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 font-headline font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-lg">undo</span>
                    Return for Changes
                  </button>
                )}
                {project.status !== 'rejected' && (
                  <button
                    onClick={() => submitReview('reject')}
                    className="w-full py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-headline font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-lg">cancel</span>
                    Reject
                  </button>
                )}
                {project.status !== 'draft' && (
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

          {/* Project metadata */}
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
