import { useState } from 'react'
import { router, Link, useForm } from '@inertiajs/react'
import type { ProjectDetail, ProjectStatus } from '@/types'

function isSafeUrl(url: string | null): boolean {
  if (!url) return false
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

interface DevlogEntry {
  id: number
  title: string
  content: string
  time_spent: string | null
  created_at: string
}

const statusConfig: Record<ProjectStatus, { label: string; bg: string; text: string; icon: string }> = {
  draft: { label: 'Draft', bg: 'bg-stone-500/10', text: 'text-stone-400', icon: 'edit_note' },
  pending: { label: 'Pending Review', bg: 'bg-amber-500/10', text: 'text-amber-400', icon: 'schedule' },
  approved: { label: 'Approved', bg: 'bg-emerald-500/10', text: 'text-emerald-400', icon: 'check_circle' },
  returned: { label: 'Returned', bg: 'bg-orange-500/10', text: 'text-orange-400', icon: 'undo' },
  rejected: { label: 'Rejected', bg: 'bg-red-500/10', text: 'text-red-400', icon: 'cancel' },
}

export default function ProjectsShow({
  project,
  devlogs,
  can,
}: {
  project: ProjectDetail
  devlogs: DevlogEntry[]
  can: { update: boolean; destroy: boolean; submit_for_review: boolean }
}) {
  const [showDevlogForm, setShowDevlogForm] = useState(false)

  const devlogForm = useForm({
    title: '',
    content: '',
    time_spent: '',
  })

  function deleteProject() {
    if (confirm('Are you sure you want to delete this project?')) {
      router.delete(`/projects/${project.id}`)
    }
  }

  function submitForReview() {
    router.post(`/projects/${project.id}/submit_for_review`)
  }

  function submitDevlog(e: React.FormEvent) {
    e.preventDefault()
    devlogForm.post(`/projects/${project.id}/devlogs`, {
      onSuccess: () => {
        devlogForm.reset()
        setShowDevlogForm(false)
      },
    })
  }

  function deleteDevlog(id: number) {
    if (confirm('Delete this devlog entry?')) {
      router.delete(`/projects/${project.id}/devlogs/${id}`)
    }
  }

  const status = statusConfig[project.status]

  return (
    <div className="p-12 max-w-[1400px] mx-auto">
      <div className="grid grid-cols-12 gap-12">
        {/* Main Content */}
        <div className="col-span-12 lg:col-span-8">
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <span className={`${status.bg} ${status.text} px-3 py-1 text-[10px] uppercase font-bold tracking-widest flex items-center gap-1.5`}>
                <span className="material-symbols-outlined text-sm">{status.icon}</span>
                {status.label}
              </span>
              {project.tags.length > 0 && project.tags.map((tag) => (
                <span key={tag} className="bg-[#353534] text-stone-300 px-3 py-1 text-[10px] uppercase font-bold tracking-widest">
                  {tag}
                </span>
              ))}
            </div>

            <h1 className="text-6xl font-headline font-bold text-[#e5e2e1] tracking-tighter mb-6 leading-none">
              {project.name}
            </h1>

            {project.description && (
              <pre className="text-lg text-stone-400 leading-relaxed max-w-xl whitespace-pre-wrap font-sans">
                {project.description}
              </pre>
            )}
          </section>

          {/* Review feedback */}
          {project.review_feedback && (project.status === 'returned' || project.status === 'rejected') && (
            <section className="mb-12">
              <div className={`${status.bg} ghost-border p-8`}>
                <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-stone-500 font-headline mb-3 flex items-center gap-2">
                  <span className={`material-symbols-outlined text-sm ${status.text}`}>{status.icon}</span>
                  Review Feedback
                </h4>
                <p className="text-stone-300 text-sm leading-relaxed">{project.review_feedback}</p>
              </div>
            </section>
          )}

          {/* Links */}
          {isSafeUrl(project.repo_link) && (
            <section className="mb-12">
              <a
                href={project.repo_link!}
                target="_blank"
                rel="noopener"
                className="inline-flex items-center gap-2 bg-[#1c1b1b] ghost-border px-6 py-3 text-sm font-headline font-medium text-[#e5e2e1] hover:bg-[#2a2a2a] transition-colors group"
              >
                <span className="material-symbols-outlined text-stone-500 group-hover:text-[#ffb595] transition-colors">code</span>
                View Repository
                <span className="material-symbols-outlined text-sm text-stone-500">open_in_new</span>
              </a>
            </section>
          )}

          {/* Devlogs */}
          {project.status === 'approved' && (
            <section className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-headline font-bold text-[#e5e2e1] tracking-tight">Devlog</h2>
                {can.update && (
                  <div className="flex gap-2">
                    {project.repo_link && (
                      <button
                        onClick={() => router.post(`/projects/${project.id}/sync_journal`)}
                        className="ghost-border bg-[#1c1b1b] hover:bg-[#2a2a2a] text-stone-400 hover:text-[#e5e2e1] px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] flex items-center gap-2 cursor-pointer transition-colors"
                      >
                        <span className="material-symbols-outlined text-lg">sync</span>
                        Sync JOURNAL.md
                      </button>
                    )}
                    <button
                      onClick={() => setShowDevlogForm(!showDevlogForm)}
                      className="signature-smolder text-[#4c1a00] px-5 py-2 text-xs font-bold uppercase tracking-[0.15em] flex items-center gap-2 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-lg">{showDevlogForm ? 'close' : 'add'}</span>
                      {showDevlogForm ? 'Cancel' : 'New Entry'}
                    </button>
                  </div>
                )}
              </div>

              {showDevlogForm && (
                <form onSubmit={submitDevlog} className="ghost-border bg-[#1c1b1b] p-6 mb-6 space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-[0.2em] text-stone-500 mb-2">Title</label>
                    <input
                      type="text"
                      value={devlogForm.data.title}
                      onChange={(e) => devlogForm.setData('title', e.target.value)}
                      className="w-full bg-[#0e0e0e] border-none px-4 py-3 text-[#e5e2e1] focus:ring-1 focus:ring-[#ee671c]/30 placeholder:text-stone-600 text-sm"
                      placeholder="e.g. Designed the PCB layout"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-[0.2em] text-stone-500 mb-2">
                      Content <span className="text-stone-600 normal-case tracking-normal">(markdown supported)</span>
                    </label>
                    <textarea
                      value={devlogForm.data.content}
                      onChange={(e) => devlogForm.setData('content', e.target.value)}
                      rows={8}
                      className="w-full bg-[#0e0e0e] border-none px-4 py-3 text-[#e5e2e1] focus:ring-1 focus:ring-[#ee671c]/30 placeholder:text-stone-600 text-sm resize-y font-mono"
                      placeholder="What did you work on? Include images, progress, challenges..."
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-[0.2em] text-stone-500 mb-2">Time Spent</label>
                    <input
                      type="text"
                      value={devlogForm.data.time_spent}
                      onChange={(e) => devlogForm.setData('time_spent', e.target.value)}
                      className="w-full bg-[#0e0e0e] border-none px-4 py-3 text-[#e5e2e1] focus:ring-1 focus:ring-[#ee671c]/30 placeholder:text-stone-600 text-sm"
                      placeholder="e.g. 3 hours"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={devlogForm.processing}
                    className="signature-smolder text-[#4c1a00] px-6 py-3 font-bold uppercase tracking-wider text-xs flex items-center gap-2 cursor-pointer"
                  >
                    {devlogForm.processing ? (
                      <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
                    ) : (
                      <span className="material-symbols-outlined text-lg">save</span>
                    )}
                    Post Entry
                  </button>
                </form>
              )}

              {devlogs.length > 0 ? (
                <div className="space-y-4">
                  {devlogs.map((entry) => (
                    <div key={entry.id} className="ghost-border bg-[#1c1b1b] p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-headline font-bold text-[#e5e2e1]">{entry.title}</h3>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-stone-500 text-xs">{entry.created_at}</span>
                            {entry.time_spent && (
                              <span className="text-[#ffb595] text-xs flex items-center gap-1">
                                <span className="material-symbols-outlined text-xs">schedule</span>
                                {entry.time_spent}
                              </span>
                            )}
                          </div>
                        </div>
                        {can.update && (
                          <button
                            onClick={() => deleteDevlog(entry.id)}
                            className="text-stone-600 hover:text-red-400 transition-colors cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-lg">delete</span>
                          </button>
                        )}
                      </div>
                      <div className="text-stone-300 text-sm leading-relaxed whitespace-pre-wrap">{entry.content}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="ghost-border bg-[#1c1b1b] p-12 text-center">
                  <span className="material-symbols-outlined text-4xl text-stone-700 mb-3">description</span>
                  <p className="text-stone-500 text-sm">No devlog entries yet. Start documenting your build!</p>
                </div>
              )}
            </section>
          )}

          {/* Creator info */}
          <section className="bg-[#1c1b1b] ghost-border p-8">
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-stone-500 font-headline mb-4">Created by</h4>
            <p className="text-[#e5e2e1] font-headline font-medium">{project.user_display_name}</p>
            <p className="text-stone-500 text-sm mt-1">{project.created_at}</p>
          </section>
        </div>

        {/* Sidebar */}
        <aside className="col-span-12 lg:col-span-4 space-y-6">
          {/* Pending status message */}
          {project.status === 'pending' && (
            <div className="bg-amber-500/5 ghost-border p-8">
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-amber-400 text-lg">schedule</span>
                <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-amber-400 font-headline">Waiting for Approval</h4>
              </div>
              <p className="text-stone-400 text-sm">Your pitch is being reviewed. You'll hear back in Slack once a decision is made.</p>
            </div>
          )}

          {/* Approved message */}
          {project.status === 'approved' && (
            <div className="bg-emerald-500/5 ghost-border p-8">
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-emerald-400 text-lg">check_circle</span>
                <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400 font-headline">Approved — Start Building!</h4>
              </div>
              <p className="text-stone-400 text-sm">Your project has been approved. Document your progress in the devlog below.</p>
            </div>
          )}

          {/* Submit for Review - only for draft/returned */}
          {can.submit_for_review && (
            <div className="bg-[#1c1b1b] ghost-border p-8">
              <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-stone-500 font-headline mb-4">Submit for Review</h4>
              {project.repo_link ? (
                <>
                  <p className="text-stone-400 text-sm mb-6">
                    {project.status === 'returned'
                      ? 'Address the feedback and resubmit your project for another review.'
                      : 'Your project is ready to be reviewed. Submit it when you\'re happy with it.'}
                  </p>
                  <button
                    onClick={submitForReview}
                    className="w-full signature-smolder text-[#4c1a00] font-headline font-bold py-3 uppercase tracking-wider active:scale-95 transition-transform flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-lg">send</span>
                    Submit for Review
                  </button>
                </>
              ) : (
                <p className="text-stone-500 text-sm">
                  Link a repository to your project before submitting for review.{' '}
                  <Link href={`/projects/${project.id}/edit`} className="text-[#ffb595] hover:underline">Edit project</Link>
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          {(can.update || can.destroy) && (
            <div className="bg-[#1c1b1b] ghost-border p-8">
              <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-stone-500 font-headline mb-6">Actions</h4>
              <div className="flex flex-col gap-3">
                {can.update && (
                  <Link
                    href={`/projects/${project.id}/edit`}
                    className="w-full py-3 px-4 bg-[#2a2a2a] hover:bg-[#3a3939] flex items-center justify-between group transition-all"
                  >
                    <span className="text-sm font-headline font-medium text-[#e5e2e1]">Edit Project</span>
                    <span className="material-symbols-outlined text-stone-500 group-hover:text-[#ffb595] transition-colors">edit</span>
                  </Link>
                )}
                {can.destroy && (
                  <button
                    onClick={deleteProject}
                    className="w-full py-3 px-4 bg-red-950/20 hover:bg-red-950/40 flex items-center justify-between group transition-all ghost-border cursor-pointer"
                  >
                    <span className="text-sm font-headline font-medium text-red-400">Delete Project</span>
                    <span className="material-symbols-outlined text-red-500/50 group-hover:text-red-400 transition-colors">delete</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Project Info */}
          <div className="bg-[#1c1b1b] ghost-border p-8">
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-stone-500 font-headline mb-6">Details</h4>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Status</span>
                <span className={`font-medium ${status.text}`}>{status.label}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Builder</span>
                <span className="text-[#e5e2e1] font-medium">{project.user_display_name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Created</span>
                <span className="text-[#e5e2e1]">{project.created_at}</span>
              </div>
              {devlogs.length > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-stone-500">Devlog Entries</span>
                  <span className="text-[#e5e2e1]">{devlogs.length}</span>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
