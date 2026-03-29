import { useState } from 'react'
import { router, Link, useForm } from '@inertiajs/react'
import Markdown from 'react-markdown'
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
  const [showRepoForm, setShowRepoForm] = useState(false)
  const [repoUrl, setRepoUrl] = useState('')

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

  function linkRepo(e: React.FormEvent) {
    e.preventDefault()
    router.patch(`/projects/${project.id}/link_repo`, { repo_link: repoUrl }, {
      onSuccess: () => { setShowRepoForm(false); setRepoUrl('') },
    })
  }

  const status = statusConfig[project.status]
  const isApproved = project.status === 'approved'
  const needsDevlogChoice = isApproved && !project.devlog_mode && can.update
  const isGitMode = project.devlog_mode === 'git'
  const isWebMode = project.devlog_mode === 'website'

  const totalHours = devlogs.reduce((sum, entry) => {
    if (!entry.time_spent) return sum
    const match = entry.time_spent.match(/([\d.]+)\s*(?:hrs?|hours?)/i)
    return match ? sum + parseFloat(match[1]) : sum
  }, 0)

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
              {project.devlog_mode && (
                <span className="bg-[#353534] text-stone-300 px-3 py-1 text-[10px] uppercase font-bold tracking-widest">
                  {project.devlog_mode === 'git' ? 'Git Journal' : 'Web Devlog'}
                </span>
              )}
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

          {/* Repo link + link repo form */}
          <section className="mb-12">
            {isSafeUrl(project.repo_link) ? (
              <a
                href={project.repo_link!}
                target="_blank"
                rel="noopener"
                className="inline-flex items-center gap-2 bg-[#1c1b1b] ghost-border px-6 py-3 text-sm font-headline font-medium text-[#e5e2e1] hover:bg-[#2a2a2a] transition-colors group corner-accents"
              >
                <span className="material-symbols-outlined text-stone-500 group-hover:text-[#ffb595] transition-colors">code</span>
                View Repository
                <span className="material-symbols-outlined text-sm text-stone-500">open_in_new</span>
              </a>
            ) : can.update ? (
              !showRepoForm ? (
                <button
                  onClick={() => setShowRepoForm(true)}
                  className="ghost-border bg-[#1c1b1b] hover:bg-[#2a2a2a] text-stone-400 hover:text-[#e5e2e1] px-6 py-3 text-sm font-headline font-medium flex items-center gap-2 cursor-pointer transition-colors corner-accents"
                >
                  <span className="material-symbols-outlined">link</span>
                  Link Repository
                </button>
              ) : (
                <form onSubmit={linkRepo} className="ghost-border bg-[#1c1b1b] p-6 space-y-4">
                  <label className="block text-xs font-bold uppercase tracking-[0.2em] text-stone-500 mb-2">Repository URL</label>
                  <p className="text-stone-500 text-xs mb-3">Works with GitHub, GitLab, Codeberg, or any git provider.</p>
                  <div className="flex gap-3">
                    <input
                      type="url"
                      value={repoUrl}
                      onChange={(e) => setRepoUrl(e.target.value)}
                      className="flex-1 bg-[#0e0e0e] border-none px-4 py-3 text-[#e5e2e1] focus:ring-1 focus:ring-[#ee671c]/30 placeholder:text-stone-600 text-sm"
                      placeholder="https://github.com/username/repo"
                      required
                    />
                    <button type="submit" className="signature-smolder text-[#4c1a00] px-6 py-3 font-bold uppercase tracking-wider text-xs cursor-pointer">
                      Link
                    </button>
                    <button type="button" onClick={() => setShowRepoForm(false)} className="ghost-border text-stone-400 px-4 py-3 text-xs cursor-pointer">
                      Cancel
                    </button>
                  </div>
                </form>
              )
            ) : null}
          </section>

          {/* Devlog mode chooser — shown once after approval */}
          {needsDevlogChoice && (
            <section className="mb-12">
              <div className="ghost-border bg-[#1c1b1b] p-8">
                <h2 className="text-2xl font-headline font-bold text-[#e5e2e1] tracking-tight mb-2">Choose Your Devlog Method</h2>
                <p className="text-stone-400 text-sm mb-8">How do you want to document your build progress?</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => router.patch(`/projects/${project.id}/set_devlog_mode`, { devlog_mode: 'git' })}
                    className="ghost-border bg-[#0e0e0e] hover:bg-[#2a2a2a] p-6 text-left transition-colors cursor-pointer group corner-accents"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className="material-symbols-outlined text-[#ffb595] text-2xl">terminal</span>
                      <span className="font-headline font-bold text-[#e5e2e1] text-lg">Git Journal</span>
                    </div>
                    <p className="text-stone-400 text-sm mb-3">
                      Add a <code className="text-[#ffb595] bg-[#1c1b1b] px-1">JOURNAL.md</code> file to your repo. Sync it to Forge anytime.
                    </p>
                    <p className="text-emerald-400 text-xs font-bold uppercase tracking-wider">Recommended — up to $1,000</p>
                  </button>

                  <button
                    onClick={() => router.patch(`/projects/${project.id}/set_devlog_mode`, { devlog_mode: 'website' })}
                    className="ghost-border bg-[#0e0e0e] hover:bg-[#2a2a2a] p-6 text-left transition-colors cursor-pointer group corner-accents"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className="material-symbols-outlined text-stone-400 text-2xl">edit_note</span>
                      <span className="font-headline font-bold text-[#e5e2e1] text-lg">Web Devlog</span>
                    </div>
                    <p className="text-stone-400 text-sm mb-3">
                      Write devlog entries directly on Forge. Great for beginners.
                    </p>
                    <p className="text-amber-400 text-xs font-bold uppercase tracking-wider">Beginner friendly — up to $200</p>
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* Devlogs — Git mode */}
          {isApproved && isGitMode && (
            <section className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-headline font-bold text-[#e5e2e1] tracking-tight">Journal</h2>
                {can.update && project.repo_link && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => router.post(`/projects/${project.id}/sync_journal`)}
                      className="signature-smolder text-[#4c1a00] px-5 py-2 text-xs font-bold uppercase tracking-[0.15em] flex items-center gap-2 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-lg">sync</span>
                      Sync
                    </button>
                    {devlogs.length > 0 && (
                      <button
                        onClick={() => { if (confirm('Clear all entries and re-sync from JOURNAL.md?')) router.post(`/projects/${project.id}/sync_journal`, { clear: 'true' }) }}
                        className="ghost-border bg-[#1c1b1b] hover:bg-[#2a2a2a] text-stone-400 hover:text-[#e5e2e1] px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] flex items-center gap-2 cursor-pointer transition-colors"
                      >
                        <span className="material-symbols-outlined text-lg">refresh</span>
                        Re-sync
                      </button>
                    )}
                  </div>
                )}
              </div>

              {!project.repo_link && can.update && (
                <div className="ghost-border bg-[#1c1b1b] p-8 text-center mb-6">
                  <span className="material-symbols-outlined text-3xl text-stone-700 mb-3">link_off</span>
                  <p className="text-stone-400 text-sm mb-4">Link a repository first, then add a JOURNAL.md file to sync your devlog.</p>
                  <button
                    onClick={() => setShowRepoForm(true)}
                    className="signature-smolder text-[#4c1a00] px-6 py-3 font-bold uppercase tracking-wider text-xs cursor-pointer"
                  >
                    Link Repository
                  </button>
                </div>
              )}

              {project.repo_link && devlogs.length === 0 && (
                <div className="ghost-border bg-[#1c1b1b] p-8 text-center">
                  <span className="material-symbols-outlined text-3xl text-stone-700 mb-3">description</span>
                  <p className="text-stone-400 text-sm mb-2">No journal entries yet.</p>
                  <p className="text-stone-500 text-xs">Add a <code className="text-[#ffb595]">JOURNAL.md</code> to your repo and click "Sync JOURNAL.md" above.</p>
                  <a href="/docs/journal" className="text-[#ffb595] text-xs hover:underline mt-2 inline-block">See the format guide</a>
                </div>
              )}

              {devlogs.length > 0 && (
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
                      </div>
                      <div className="prose prose-invert prose-sm max-w-none text-stone-300 prose-a:text-[#ffb595] prose-img:max-w-full prose-img:rounded-none"><Markdown>{entry.content}</Markdown></div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Devlogs — Website mode */}
          {isApproved && isWebMode && (
            <section className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-headline font-bold text-[#e5e2e1] tracking-tight">Devlog</h2>
                  <p className="text-amber-400/60 text-xs mt-1">Web devlog — up to $200 funding</p>
                </div>
                {can.update && (
                  <button
                    onClick={() => setShowDevlogForm(!showDevlogForm)}
                    className="signature-smolder text-[#4c1a00] px-5 py-2 text-xs font-bold uppercase tracking-[0.15em] flex items-center gap-2 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-lg">{showDevlogForm ? 'close' : 'add'}</span>
                    {showDevlogForm ? 'Cancel' : 'New Entry'}
                  </button>
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
                      <div className="prose prose-invert prose-sm max-w-none text-stone-300 prose-a:text-[#ffb595] prose-img:max-w-full prose-img:rounded-none"><Markdown>{entry.content}</Markdown></div>
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
          {isApproved && (
            <div className="bg-emerald-500/5 ghost-border p-8">
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-emerald-400 text-lg">check_circle</span>
                <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400 font-headline">Approved — Start Building!</h4>
              </div>
              <p className="text-stone-400 text-sm">
                {!project.devlog_mode
                  ? 'Choose your devlog method below to get started.'
                  : project.devlog_mode === 'git'
                    ? 'Document your progress in JOURNAL.md and sync it here.'
                    : 'Add devlog entries to document your progress.'}
              </p>
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
                  Link a repository to your project before submitting for review.
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
                    className="w-full py-3 px-4 bg-[#2a2a2a] hover:bg-[#3a3939] flex items-center justify-between group transition-all corner-accents"
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
              {project.devlog_mode && (
                <div className="flex justify-between text-sm">
                  <span className="text-stone-500">Devlog</span>
                  <span className="text-[#e5e2e1]">{project.devlog_mode === 'git' ? 'Git Journal' : 'Web (up to $200)'}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Builder</span>
                <span className="text-[#e5e2e1] font-medium">{project.user_display_name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Created</span>
                <span className="text-[#e5e2e1]">{project.created_at}</span>
              </div>
              {devlogs.length > 0 && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-500">Entries</span>
                    <span className="text-[#e5e2e1]">{devlogs.length}</span>
                  </div>
                  {totalHours > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-stone-500">Total Hours</span>
                      <span className="text-[#ffb595] font-bold">{totalHours}h</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
