import { useState, useRef } from 'react'
import { router, Link, useForm, usePage } from '@inertiajs/react'
import Markdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import remarkGfm from 'remark-gfm'
import type { ProjectDetail, ProjectStatus, SharedProps } from '@/types'

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
  status: 'draft' | 'pending' | 'approved' | 'returned'
  approved_hours: number | null
  review_feedback: string | null
  created_at: string
}

interface ProjectKudo {
  id: number
  content: string
  author_id: number
  author_name: string
  author_avatar: string
  author_is_staff: boolean
  can_destroy: boolean
  created_at: string
}

const statusConfig: Record<ProjectStatus, { label: string; bg: string; text: string; icon: string }> = {
  draft: { label: 'Draft', bg: 'bg-stone-500/10', text: 'text-stone-400', icon: 'edit_note' },
  pending: { label: 'Pending Review', bg: 'bg-amber-500/10', text: 'text-amber-400', icon: 'schedule' },
  approved: { label: 'Approved', bg: 'bg-emerald-500/10', text: 'text-emerald-400', icon: 'check_circle' },
  returned: { label: 'Returned', bg: 'bg-orange-500/10', text: 'text-orange-400', icon: 'undo' },
  rejected: { label: 'Rejected', bg: 'bg-red-500/10', text: 'text-red-400', icon: 'cancel' },
  build_pending: { label: 'Build Under Review', bg: 'bg-amber-500/10', text: 'text-amber-400', icon: 'engineering' },
  build_approved: { label: 'Build Approved', bg: 'bg-emerald-500/10', text: 'text-emerald-400', icon: 'verified' },
  pitch_approved: { label: 'Pitch Approved', bg: 'bg-emerald-500/10', text: 'text-emerald-400', icon: 'check_circle' },
  pitch_pending: { label: 'Pitch Under Review', bg: 'bg-amber-500/10', text: 'text-amber-400', icon: 'schedule' },
}

const devlogStatusConfig: Record<string, { label: string; bg: string; text: string; icon: string }> = {
  draft: { label: 'Draft', bg: 'bg-stone-500/10', text: 'text-stone-400', icon: 'edit_note' },
  pending: { label: 'Under Review', bg: 'bg-amber-500/10', text: 'text-amber-400', icon: 'schedule' },
  approved: { label: 'Approved', bg: 'bg-emerald-500/10', text: 'text-emerald-400', icon: 'check_circle' },
  returned: { label: 'Needs Work', bg: 'bg-orange-500/10', text: 'text-orange-400', icon: 'undo' },
}

export default function ProjectsShow({
  project,
  devlogs,
  kudos,
  can,
  is_admin_view,
}: {
  project: ProjectDetail
  devlogs: DevlogEntry[]
  kudos: ProjectKudo[]
  can: { update: boolean; destroy: boolean; submit_for_review: boolean; give_kudos: boolean }
  is_admin_view: boolean
}) {
  const [kudoContent, setKudoContent] = useState('')

  function submitKudo(e: React.FormEvent) {
    e.preventDefault()
    if (!kudoContent.trim()) return
    router.post(`/projects/${project.id}/add_kudo`, { content: kudoContent }, {
      preserveScroll: true,
      onSuccess: () => setKudoContent(''),
    })
  }

  function deleteKudo(kudoId: number) {
    if (!confirm('Delete this kudos?')) return
    router.delete(`/projects/${project.id}/kudos/${kudoId}`, { preserveScroll: true })
  }

  const [showDevlogForm, setShowDevlogForm] = useState(false)
  const [showRepoForm, setShowRepoForm] = useState(false)
  const [repoUrl, setRepoUrl] = useState('')
  const [uploadingCover, setUploadingCover] = useState(false)
  const [editingSubtitle, setEditingSubtitle] = useState(false)
  const [subtitleDraft, setSubtitleDraft] = useState(project.subtitle || '')

  const devlogForm = useForm({
    title: '',
    content: '',
    time_spent: '',
  })

  const [editingDevlogId, setEditingDevlogId] = useState<number | null>(null)
  const editDevlogForm = useForm({
    title: '',
    content: '',
    time_spent: '',
  })

  function startEditDevlog(entry: DevlogEntry) {
    setEditingDevlogId(entry.id)
    editDevlogForm.setData({
      title: entry.title,
      content: entry.content,
      time_spent: entry.time_spent || '',
    })
  }

  function cancelEditDevlog() {
    setEditingDevlogId(null)
    editDevlogForm.reset()
  }

  function submitEditDevlog(e: React.FormEvent, id: number) {
    e.preventDefault()
    editDevlogForm.patch(`/projects/${project.id}/devlogs/${id}`, {
      preserveScroll: true,
      onSuccess: () => {
        setEditingDevlogId(null)
        editDevlogForm.reset()
      },
    })
  }


  function uploadCoverImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingCover(true)
    const formData = new FormData()
    formData.append('cover_image', file)
    const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content
    fetch(`/projects/${project.id}/upload_cover_image`, {
      method: 'POST',
      headers: csrfToken ? { 'X-CSRF-Token': csrfToken } : {},
      body: formData,
    }).then(() => {
      setUploadingCover(false)
      router.reload()
    }).catch(() => setUploadingCover(false))
  }

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

  const contentRef = useRef('')

  function handleImagePaste(
    e: React.ClipboardEvent<HTMLTextAreaElement>,
    setContent: (val: string) => void,
    currentContent: string,
  ) {
    const items = e.clipboardData?.items
    if (!items) return

    for (const item of Array.from(items)) {
      if (!item.type.startsWith('image/')) continue
      e.preventDefault()
      const file = item.getAsFile()
      if (!file) return

      const textarea = e.currentTarget
      const start = textarea.selectionStart
      const placeholder = `![Uploading ${file.name}...]()`
      const before = currentContent.slice(0, start)
      const after = currentContent.slice(textarea.selectionEnd)
      const withPlaceholder = before + placeholder + after
      setContent(withPlaceholder)
      contentRef.current = withPlaceholder

      const formData = new FormData()
      formData.append('file', file)
      const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content
      fetch(`/projects/${project.id}/devlog_image`, {
        method: 'POST',
        headers: csrfToken ? { 'X-CSRF-Token': csrfToken } : {},
        body: formData,
      })
        .then((res) => res.json())
        .then((data) => {
          const updated = contentRef.current.replace(placeholder, data.markdown)
          contentRef.current = updated
          setContent(updated)
        })
        .catch(() => {
          const updated = contentRef.current.replace(placeholder, `![upload failed]()`)
          contentRef.current = updated
          setContent(updated)
        })
      return
    }
  }

  function linkRepo(e: React.FormEvent) {
    e.preventDefault()
    router.patch(`/projects/${project.id}/link_repo`, { repo_link: repoUrl }, {
      onSuccess: () => { setShowRepoForm(false); setRepoUrl('') },
    })
  }

  function saveSubtitle(e: React.FormEvent) {
    e.preventDefault()
    router.patch(`/projects/${project.id}`, {
      project: { name: project.name, subtitle: subtitleDraft, repo_link: project.repo_link || '', tier: project.tier, tags: project.tags },
    }, {
      preserveScroll: true,
      onSuccess: () => setEditingSubtitle(false),
    })
  }

  const status = statusConfig[project.status]
  const isNormalTier = project.tier !== 'tier_1'
  const isPitchApproved = project.status === 'pitch_approved'
  const isBuildApproved = project.status === 'build_approved'
  const isPending = project.status === 'pending'
  const isBuildingPhase = isPitchApproved || isBuildApproved || isPending || project.status === 'build_pending' || project.status === 'approved' || (project.status === 'draft' && isNormalTier)
  const isGitMode = project.devlog_mode === 'git'
  const isWebMode = project.devlog_mode === 'website'
  const canLog = isBuildingPhase
  const needsDevlogChoice = canLog && !project.devlog_mode && can.update
  const showGitDevlog = canLog && isGitMode
  const showWebDevlog = canLog && isWebMode
  const showCoverUpload = can.update && canLog

  const totalHours = devlogs.reduce((sum, entry) => {
    if (!entry.time_spent) return sum
    const match = entry.time_spent.match(/([\d.]+)/)
    return match ? sum + parseFloat(match[1]) : sum
  }, 0)

  const isStaff = !!usePage<SharedProps>().props.auth.user?.is_staff

  return (
    <div className="p-5 md:p-12 max-w-[1400px] mx-auto">
      {is_admin_view && (
        <div className="mb-6 border border-amber-500/40 bg-amber-500/10 px-5 py-3 flex items-center gap-3 flex-wrap">
          <span className="material-symbols-outlined text-amber-400">shield_person</span>
          <p className="text-amber-300 text-sm flex-1 min-w-0">
            <span className="font-bold">Admin view.</span> You're editing <span className="font-bold">{project.user_display_name}'s</span> project. Changes affect them, not you.
          </p>
        </div>
      )}
      {isStaff && (
        <div className="mb-6 flex justify-end">
          <Link
            href={`/admin/projects/${project.id}`}
            className="ghost-border bg-[#1c1b1b] hover:bg-[#2a2a2a] text-stone-400 hover:text-[#ffb595] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.15em] inline-flex items-center gap-2 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">shield_person</span>
            View on Admin Page
          </Link>
        </div>
      )}
      <header className="mb-10 ghost-border bg-[#1c1b1b] overflow-hidden">
        {project.cover_image_url ? (
          <div className="relative group">
            <img src={project.cover_image_url} alt={project.name} className="w-full max-h-[320px] object-cover" />
            {showCoverUpload && (
              <label className="absolute top-3 right-3 bg-black/70 hover:bg-black/90 text-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] flex items-center gap-2 cursor-pointer transition-all opacity-0 group-hover:opacity-100">
                <span className="material-symbols-outlined text-sm">upload</span>
                {uploadingCover ? 'Uploading...' : 'Replace'}
                <input type="file" accept="image/*" onChange={uploadCoverImage} className="hidden" disabled={uploadingCover} />
              </label>
            )}
          </div>
        ) : showCoverUpload ? (
          <label className="block bg-[#0e0e0e] hover:bg-[#2a2a2a] text-stone-500 hover:text-[#e5e2e1] px-4 py-12 text-xs font-bold uppercase tracking-[0.15em] flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors border-b border-white/5">
            <span className="material-symbols-outlined text-3xl">add_photo_alternate</span>
            {uploadingCover ? 'Uploading...' : 'Upload Cover Image'}
            <input type="file" accept="image/*" onChange={uploadCoverImage} className="hidden" disabled={uploadingCover} />
          </label>
        ) : null}
        <div className="p-8">
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {!((isPitchApproved || isPending) && isNormalTier) && (
              <span className={`${status.bg} ${status.text} px-3 py-1 text-[10px] uppercase font-bold tracking-widest flex items-center gap-1.5`}>
                <span className="material-symbols-outlined text-sm">{status.icon}</span>
                {status.label}
              </span>
            )}
            {project.devlog_mode && (
              <span className="bg-[#353534] text-stone-400 px-3 py-1 text-[10px] uppercase font-bold tracking-widest">
                {project.devlog_mode === 'git' ? 'Git Journal' : 'Web Devlog'}
              </span>
            )}
            <span className="bg-[#353534] text-stone-400 px-3 py-1 text-[10px] uppercase font-bold tracking-widest">
              {isNormalTier ? 'Normal' : 'Advanced'}
            </span>
            {project.built_at && (
              <span className="bg-emerald-500/10 text-emerald-400 px-3 py-1 text-[10px] uppercase font-bold tracking-widest flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">verified</span>
                Built {project.built_at}
              </span>
            )}
          </div>

          <h1 className="text-5xl font-headline font-bold text-[#e5e2e1] tracking-tight mb-3 leading-none">
            {project.name}
          </h1>

          {editingSubtitle && can.update ? (
            <form onSubmit={saveSubtitle} className="space-y-3 mb-4 max-w-2xl">
              <textarea
                value={subtitleDraft}
                onChange={(e) => setSubtitleDraft(e.target.value)}
                rows={2}
                className="w-full bg-[#0e0e0e] border-none px-4 py-3 text-[#e5e2e1] focus:ring-1 focus:ring-[#ee671c]/30 placeholder:text-stone-600 text-sm"
                placeholder="A short description of your project"
                autoFocus
              />
              <div className="flex gap-2">
                <button type="submit" className="signature-smolder text-[#4c1a00] px-5 py-2 text-xs font-bold uppercase tracking-[0.15em] cursor-pointer">Save</button>
                <button type="button" onClick={() => { setEditingSubtitle(false); setSubtitleDraft(project.subtitle || '') }} className="ghost-border text-stone-400 px-4 py-2 text-xs cursor-pointer">Cancel</button>
              </div>
            </form>
          ) : project.subtitle ? (
            <p className="text-lg text-stone-400 leading-relaxed max-w-2xl group inline-flex items-start gap-2 mb-4">
              <span>{project.subtitle}</span>
              {can.update && (
                <button onClick={() => setEditingSubtitle(true)} className="text-stone-600 hover:text-[#ffb595] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer mt-1" title="Edit description">
                  <span className="material-symbols-outlined text-sm">edit</span>
                </button>
              )}
            </p>
          ) : can.update ? (
            <button
              onClick={() => setEditingSubtitle(true)}
              className="ghost-border bg-[#0e0e0e] hover:bg-[#2a2a2a] text-stone-400 hover:text-[#e5e2e1] px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] inline-flex items-center gap-2 cursor-pointer transition-colors mb-4"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              Add Description
            </button>
          ) : null}


          <div className="flex flex-wrap items-center gap-4 pt-5 border-t border-white/5">
            <Link
              href={`/users/${project.user_id}`}
              className="flex items-center gap-3 text-stone-300 hover:text-[#ffb595] transition-colors group"
            >
              <img src={project.user_avatar} alt={project.user_display_name} className="w-10 h-10 border border-white/10" />
              <div>
                <p className="text-sm font-headline font-bold group-hover:text-[#ffb595] transition-colors">{project.user_display_name}</p>
                <p className="text-[10px] uppercase tracking-[0.2em] text-stone-600">Started {project.created_at}</p>
              </div>
            </Link>

            <div className="flex items-center gap-6 ml-auto text-xs flex-wrap">
              {devlogs.length > 0 && totalHours > 0 && (
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-base text-[#ffb595]">schedule</span>
                  <span className="text-[#ffb595] font-headline font-bold text-base">{totalHours}h</span>
                </div>
              )}
              {devlogs.length > 0 && (
                <div className="flex items-center gap-2 text-stone-400">
                  <span className="material-symbols-outlined text-base">description</span>
                  <span className="font-headline font-bold text-base">{devlogs.length}</span>
                  <span className="text-stone-600">{devlogs.length === 1 ? 'entry' : 'entries'}</span>
                </div>
              )}
              {kudos.length > 0 && (
                <div className="flex items-center gap-2 text-stone-400">
                  <span className="material-symbols-outlined text-base text-[#ee671c]">favorite</span>
                  <span className="font-headline font-bold text-base">{kudos.length}</span>
                </div>
              )}
              {isSafeUrl(project.repo_link) && (
                <a href={project.repo_link!} target="_blank" rel="noopener" className="flex items-center gap-2 text-stone-400 hover:text-[#ffb595] transition-colors">
                  <span className="material-symbols-outlined text-base">code</span>
                  <span>Repository</span>
                  <span className="material-symbols-outlined text-xs">open_in_new</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-8">

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

          {can.update && !isSafeUrl(project.repo_link) && showRepoForm && (
            <section className="mb-12">
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
            </section>
          )}

          {needsDevlogChoice && (
            <section className="mb-8">
              <div className="ghost-border bg-[#1c1b1b] p-6">
                <h2 className="text-lg font-headline font-bold text-[#e5e2e1] tracking-tight mb-1">Choose Your Devlog Method</h2>
                <p className="text-stone-500 text-xs mb-5">How do you want to document your build progress?</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button
                    onClick={() => router.patch(`/projects/${project.id}/set_devlog_mode`, { devlog_mode: 'git' })}
                    className="ghost-border bg-[#0e0e0e] hover:bg-[#2a2a2a] p-4 text-left transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="material-symbols-outlined text-[#ffb595] text-lg">terminal</span>
                      <span className="font-headline font-bold text-[#e5e2e1] text-sm">Git Journal</span>
                    </div>
                    <p className="text-stone-500 text-xs">
                      Add a <code className="text-[#ffb595]">JOURNAL.md</code> to your repo and sync it.
                    </p>
                  </button>

                  <button
                    onClick={() => router.patch(`/projects/${project.id}/set_devlog_mode`, { devlog_mode: 'website' })}
                    className="ghost-border bg-[#0e0e0e] hover:bg-[#2a2a2a] p-4 text-left transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="material-symbols-outlined text-stone-400 text-lg">edit_note</span>
                      <span className="font-headline font-bold text-[#e5e2e1] text-sm">Web Devlog</span>
                    </div>
                    <p className="text-stone-500 text-xs">
                      Write devlog entries directly on Forge.
                    </p>
                  </button>
                </div>
              </div>
            </section>
          )}

          {showGitDevlog && (
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
                  {can.update ? (
                    <>
                      <p className="text-stone-400 text-sm mb-2">No journal entries yet.</p>
                      <p className="text-stone-500 text-xs">Add a <code className="text-[#ffb595]">JOURNAL.md</code> to your repo and click "Sync JOURNAL.md" above.</p>
                      <a href="/docs/Requirements-and-Shipping/journal-format" className="text-[#ffb595] text-xs hover:underline mt-2 inline-block">See the format guide</a>
                    </>
                  ) : (
                    <p className="text-stone-400 text-sm">{project.user_display_name} hasn't added a journal entry yet.</p>
                  )}
                </div>
              )}

              {devlogs.length > 0 && (
                <div className="space-y-4">
                  {devlogs.map((entry) => (
                    <div key={entry.id} className="ghost-border bg-[#1c1b1b] p-6 overflow-hidden">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <Link href={`/projects/${project.id}/devlogs/${entry.id}`} className="font-headline font-bold text-[#e5e2e1] hover:text-[#ffb595] transition-colors">{entry.title}</Link>
                            {(() => {
                              const ds = devlogStatusConfig[entry.status]
                              return ds ? (
                                <span className={`${ds.bg} ${ds.text} px-2 py-0.5 text-[9px] uppercase font-bold tracking-widest flex items-center gap-1`}>
                                  <span className="material-symbols-outlined text-[10px]">{ds.icon}</span>
                                  {ds.label}
                                </span>
                              ) : null
                            })()}
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-stone-500 text-xs">{entry.created_at}</span>
                            {entry.time_spent && (
                              <span className="text-[#ffb595] text-xs flex items-center gap-1">
                                <span className="material-symbols-outlined text-xs">schedule</span>
                                {entry.approved_hours != null ? `${entry.approved_hours}h (claimed ${entry.time_spent})` : entry.time_spent}
                              </span>
                            )}
                          </div>
                        </div>
                        {can.update && (entry.status === 'draft' || entry.status === 'returned') && (
                          <button
                            onClick={() => router.post(`/projects/${project.id}/devlogs/${entry.id}/submit_for_review`)}
                            className="text-stone-600 hover:text-emerald-400 transition-colors cursor-pointer shrink-0"
                            aria-label="Submit for review"
                            title="Submit for review"
                          >
                            <span className="material-symbols-outlined text-lg">send</span>
                          </button>
                        )}
                      </div>
                      {entry.review_feedback && entry.status === 'returned' && (
                        <div className="bg-orange-500/10 ghost-border p-3 mb-3 text-orange-300 text-xs">
                          <span className="font-bold uppercase tracking-wider">Reviewer feedback:</span> {entry.review_feedback}
                        </div>
                      )}
                      <div className="prose prose-invert prose-sm max-w-none text-stone-300 prose-a:text-[#ffb595] prose-img:max-w-full prose-img:rounded-none break-words [overflow-wrap:anywhere]"><Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>{entry.content}</Markdown></div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {!can.update && !showGitDevlog && !showWebDevlog && (
            <section className="mb-12">
              <div className="ghost-border bg-[#1c1b1b] p-12 text-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #ffb595 0, #ffb595 1px, transparent 1px, transparent 24px)' }} />
                <div className="relative">
                  <img src="/orph-building.png" alt="" className="h-32 mx-auto mb-4 opacity-70" />
                  <p className="text-[#e5e2e1] font-headline font-bold text-lg mb-2">Forge in progress</p>
                  <p className="text-stone-500 text-sm max-w-sm mx-auto">
                    {project.user_display_name.split(' ')[0]} hasn't posted devlog entries yet. Check back soon to follow along with the build.
                  </p>
                </div>
              </div>
            </section>
          )}

          {showWebDevlog && (
            <section className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-headline font-bold text-[#e5e2e1] tracking-tight">Devlog</h2>
                </div>
                <div className="flex gap-2">
                  {can.update && devlogs.length > 0 && (
                    <a
                      href={`/projects/${project.id}/export_devlogs`}
                      className="ghost-border bg-[#1c1b1b] hover:bg-[#2a2a2a] text-stone-400 hover:text-[#e5e2e1] px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] flex items-center gap-2 transition-colors"
                    >
                      <span className="material-symbols-outlined text-lg">download</span>
                      Export
                    </a>
                  )}
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
                      onPaste={(e) => handleImagePaste(e, (v) => devlogForm.setData('content', v), devlogForm.data.content)}
                      rows={8}
                      className="w-full bg-[#0e0e0e] border-none px-4 py-3 text-[#e5e2e1] focus:ring-1 focus:ring-[#ee671c]/30 placeholder:text-stone-600 text-sm resize-y font-mono"
                      placeholder="What did you work on? Paste images directly..."
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
                    <div key={entry.id} className="ghost-border bg-[#1c1b1b] p-6 overflow-hidden">
                      {editingDevlogId === entry.id ? (
                        <form onSubmit={(e) => submitEditDevlog(e, entry.id)} className="space-y-4">
                          <div>
                            <label className="block text-xs font-bold uppercase tracking-[0.2em] text-stone-500 mb-2">Title</label>
                            <input
                              type="text"
                              value={editDevlogForm.data.title}
                              onChange={(e) => editDevlogForm.setData('title', e.target.value)}
                              className="w-full bg-[#0e0e0e] border-none px-4 py-3 text-[#e5e2e1] focus:ring-1 focus:ring-[#ee671c]/30 placeholder:text-stone-600 text-sm"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold uppercase tracking-[0.2em] text-stone-500 mb-2">
                              Content <span className="text-stone-600 normal-case tracking-normal">(markdown supported)</span>
                            </label>
                            <textarea
                              value={editDevlogForm.data.content}
                              onChange={(e) => editDevlogForm.setData('content', e.target.value)}
                              onPaste={(e) => handleImagePaste(e, (v) => editDevlogForm.setData('content', v), editDevlogForm.data.content)}
                              rows={8}
                              className="w-full bg-[#0e0e0e] border-none px-4 py-3 text-[#e5e2e1] focus:ring-1 focus:ring-[#ee671c]/30 placeholder:text-stone-600 text-sm resize-y font-mono"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold uppercase tracking-[0.2em] text-stone-500 mb-2">Time Spent</label>
                            <input
                              type="text"
                              value={editDevlogForm.data.time_spent}
                              onChange={(e) => editDevlogForm.setData('time_spent', e.target.value)}
                              className="w-full bg-[#0e0e0e] border-none px-4 py-3 text-[#e5e2e1] focus:ring-1 focus:ring-[#ee671c]/30 placeholder:text-stone-600 text-sm"
                              placeholder="e.g. 3 or 3 hours"
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="submit"
                              disabled={editDevlogForm.processing}
                              className="signature-smolder text-[#4c1a00] px-6 py-3 font-bold uppercase tracking-wider text-xs flex items-center gap-2 cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-lg">save</span>
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={cancelEditDevlog}
                              className="ghost-border text-stone-400 px-6 py-3 text-xs font-bold uppercase tracking-wider hover:text-[#e5e2e1] transition-colors cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      ) : (
                        <>
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <Link href={`/projects/${project.id}/devlogs/${entry.id}`} className="font-headline font-bold text-[#e5e2e1] hover:text-[#ffb595] transition-colors">{entry.title}</Link>
                                {(() => {
                                  const ds = devlogStatusConfig[entry.status]
                                  return ds ? (
                                    <span className={`${ds.bg} ${ds.text} px-2 py-0.5 text-[9px] uppercase font-bold tracking-widest flex items-center gap-1`}>
                                      <span className="material-symbols-outlined text-[10px]">{ds.icon}</span>
                                      {ds.label}
                                    </span>
                                  ) : null
                                })()}
                              </div>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="text-stone-500 text-xs">{entry.created_at}</span>
                                {entry.time_spent && (
                                  <span className="text-[#ffb595] text-xs flex items-center gap-1">
                                    <span className="material-symbols-outlined text-xs">schedule</span>
                                    {entry.approved_hours != null ? `${entry.approved_hours}h (claimed ${entry.time_spent})` : entry.time_spent}
                                  </span>
                                )}
                              </div>
                            </div>
                            {can.update && (
                              <div className="flex items-center gap-2 shrink-0">
                                {(entry.status === 'draft' || entry.status === 'returned') && (
                                  <>
                                    <button
                                      onClick={() => startEditDevlog(entry)}
                                      className="text-stone-600 hover:text-[#ffb595] transition-colors cursor-pointer"
                                      aria-label="Edit devlog"
                                    >
                                      <span className="material-symbols-outlined text-lg">edit</span>
                                    </button>
                                    <button
                                      onClick={() => router.post(`/projects/${project.id}/devlogs/${entry.id}/submit_for_review`)}
                                      className="text-stone-600 hover:text-emerald-400 transition-colors cursor-pointer"
                                      aria-label="Submit for review"
                                      title="Submit for review"
                                    >
                                      <span className="material-symbols-outlined text-lg">send</span>
                                    </button>
                                  </>
                                )}
                                {entry.status === 'draft' && !project.airtable_sent && (
                                  <button
                                    onClick={() => deleteDevlog(entry.id)}
                                    className="text-stone-600 hover:text-red-400 transition-colors cursor-pointer"
                                    aria-label="Delete devlog"
                                  >
                                    <span className="material-symbols-outlined text-lg">delete</span>
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                          {entry.review_feedback && entry.status === 'returned' && (
                            <div className="bg-orange-500/10 ghost-border p-3 mb-3 text-orange-300 text-xs">
                              <span className="font-bold uppercase tracking-wider">Reviewer feedback:</span> {entry.review_feedback}
                            </div>
                          )}
                          <div className="prose prose-invert prose-sm max-w-none text-stone-300 prose-a:text-[#ffb595] prose-img:max-w-full prose-img:rounded-none break-words [overflow-wrap:anywhere]"><Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>{entry.content}</Markdown></div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="ghost-border bg-[#1c1b1b] p-12 text-center">
                  <span className="material-symbols-outlined text-4xl text-stone-700 mb-3">description</span>
                  <p className="text-stone-500 text-sm">
                    {can.update
                      ? 'No devlog entries yet. Start documenting your build!'
                      : `${project.user_display_name} hasn't added a devlog entry yet.`}
                  </p>
                </div>
              )}
            </section>
          )}

        </div>

        <aside className="col-span-12 lg:col-span-4 space-y-6">
          {!can.update && (
            <div className="bg-[#1c1b1b] ghost-border p-6">
              <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-stone-500 font-headline mb-4">Builder</h4>
              <Link href={`/users/${project.user_id}`} className="flex items-center gap-3 group">
                <img src={project.user_avatar} alt={project.user_display_name} className="w-12 h-12 border border-white/10 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-headline font-bold text-[#e5e2e1] group-hover:text-[#ffb595] transition-colors truncate">
                    {project.user_display_name}
                  </p>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-stone-600 mt-0.5 flex items-center gap-1">
                    View profile
                    <span className="material-symbols-outlined text-xs">arrow_forward</span>
                  </p>
                </div>
              </Link>
              <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-white/5">
                <div>
                  <p className="text-xl font-headline font-bold text-[#e5e2e1]">{totalHours}<span className="text-xs text-stone-500 ml-0.5">h</span></p>
                  <p className="text-[9px] uppercase tracking-[0.15em] text-stone-600 mt-0.5">Logged</p>
                </div>
                <div>
                  <p className="text-xl font-headline font-bold text-[#e5e2e1]">{devlogs.length}</p>
                  <p className="text-[9px] uppercase tracking-[0.15em] text-stone-600 mt-0.5">{devlogs.length === 1 ? 'Entry' : 'Entries'}</p>
                </div>
                <div>
                  <p className="text-xl font-headline font-bold text-[#e5e2e1]">{kudos.length}</p>
                  <p className="text-[9px] uppercase tracking-[0.15em] text-stone-600 mt-0.5">Kudos</p>
                </div>
              </div>
            </div>
          )}

          {!can.update && project.build_proof_url && project.built_at && (
            <div className="bg-emerald-500/5 ghost-border p-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-emerald-400 text-lg">verified</span>
                <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400 font-headline">Built on {project.built_at}</h4>
              </div>
              <a href={project.build_proof_url} target="_blank" rel="noopener" className="text-[#ffb595] hover:text-[#ee671c] text-xs flex items-center gap-1 break-all">
                View build proof
                <span className="material-symbols-outlined text-xs">open_in_new</span>
              </a>
            </div>
          )}

          {showWebDevlog && devlogs.length > 0 && (
            <div className="ghost-border bg-[#1c1b1b] p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-[#ffb595] text-lg">schedule</span>
                <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-stone-500 font-headline">Time Logged</h4>
              </div>
              <p className="text-4xl font-headline font-bold text-[#e5e2e1] tracking-tight">
                {totalHours}<span className="text-xl text-stone-500 ml-1">h</span>
              </p>
              <p className="text-stone-500 text-xs mt-2">
                Across {devlogs.length} {devlogs.length === 1 ? 'entry' : 'entries'}
              </p>
            </div>
          )}
          {can.update && !isSafeUrl(project.repo_link) && !showRepoForm && (
            <button
              onClick={() => setShowRepoForm(true)}
              className="w-full ghost-border bg-[#1c1b1b] hover:bg-[#2a2a2a] text-stone-400 hover:text-[#e5e2e1] px-6 py-3 text-sm font-headline font-medium flex items-center justify-center gap-2 cursor-pointer transition-colors corner-accents"
            >
              <span className="material-symbols-outlined">link</span>
              Link Repository
            </button>
          )}
          {can.update && project.status === 'pitch_pending' && (
            <div className="bg-amber-500/5 ghost-border p-8">
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-amber-400 text-lg">schedule</span>
                <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-amber-400 font-headline">Pitch Under Review</h4>
              </div>
              <p className="text-stone-400 text-sm">Your pitch is being reviewed. You'll hear back in Slack once a decision is made.</p>
            </div>
          )}

          {can.update && isPitchApproved && project.tier === 'tier_1' && (
            <div className="bg-emerald-500/5 ghost-border p-8">
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-emerald-400 text-lg">check_circle</span>
                <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400 font-headline">Pitch Approved — Start Building!</h4>
              </div>
              <p className="text-stone-400 text-sm">
                {!project.devlog_mode
                  ? 'Choose your devlog method below to get started.'
                  : 'Add devlog entries and submit each one for review. Approved entries earn coins.'}
              </p>
            </div>
          )}

          {can.update && (isPitchApproved || isPending) && project.devlog_mode && devlogs.filter((d) => d.status === 'approved').length > 0 && (
            (() => {
              const hasCover = !!project.cover_image_url
              const hasAddress = project.user_has_address
              const canFinish = hasCover && hasAddress
              return (
                <div className="bg-[#1c1b1b] ghost-border p-8">
                  <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-stone-500 font-headline mb-4">Finish Project</h4>
                  {!canFinish && (
                    <div className="mb-4 bg-amber-500/10 border border-amber-500/20 p-4 text-amber-200 text-xs">
                      <p className="font-bold uppercase tracking-wider mb-2">Before finishing:</p>
                      <ul className="space-y-1">
                        {!hasCover && <li>• Upload a project cover image</li>}
                        {!hasAddress && <li>• Add your shipping address in <a href="/settings" className="underline hover:text-amber-100">settings</a></li>}
                      </ul>
                    </div>
                  )}
                  <button
                    disabled={!canFinish}
                    onClick={() => { if (confirm('Mark this project as finished? This will queue it for processing.')) router.post(`/projects/${project.id}/finish_project`) }}
                    className={`w-full font-headline font-bold py-3 uppercase tracking-wider transition-transform flex items-center justify-center gap-2 ${canFinish ? 'signature-smolder text-[#4c1a00] active:scale-95 cursor-pointer' : 'bg-stone-700/40 text-stone-500 cursor-not-allowed'}`}
                  >
                    <span className="material-symbols-outlined text-lg">verified</span>
                    Finish Project
                  </button>
                </div>
              )
            })()
          )}

          {can.update && isBuildApproved && (
            <div className="bg-emerald-500/5 ghost-border p-8">
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-emerald-400 text-lg">verified</span>
                <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400 font-headline">Project Finished!</h4>
              </div>
              <p className="text-stone-400 text-sm">Your project has been submitted and is being processed.</p>
            </div>
          )}

          {can.update && project.status === 'returned' && project.tier === 'tier_1' && project.from_slack && (
            <div className="bg-[#1c1b1b] ghost-border p-8">
              <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-stone-500 font-headline mb-4">Resubmit Pitch</h4>
              <p className="text-stone-400 text-sm mb-4">
                Edit your original message in <span className="text-[#ffb595] font-bold">#into-the-forge</span> on Slack with the requested changes, then hit resubmit.
              </p>
              <button
                onClick={() => router.post(`/projects/${project.id}/resubmit_pitch`)}
                className="w-full signature-smolder text-[#4c1a00] font-headline font-bold py-3 uppercase tracking-wider active:scale-95 transition-transform flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">refresh</span>
                Resubmit Pitch
              </button>
            </div>
          )}


          {can.update && project.status === 'build_approved' && (
            <div className="bg-[#1c1b1b] ghost-border p-6">
              <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-stone-500 font-headline mb-4">Mark as Built</h4>
              {project.built_at ? (
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 text-sm">
                  <p className="text-emerald-300 font-headline font-bold mb-2 flex items-center gap-2">
                    <span className="material-symbols-outlined text-base">check_circle</span>
                    Built on {project.built_at}
                  </p>
                  {project.build_proof_url && (
                    <a href={project.build_proof_url} target="_blank" rel="noopener" className="text-[#ffb595] hover:text-[#ee671c] text-xs flex items-center gap-1 break-all">
                      View proof
                      <span className="material-symbols-outlined text-xs">open_in_new</span>
                    </a>
                  )}
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    const form = e.currentTarget as HTMLFormElement
                    const url = (form.elements.namedItem('build_proof_url') as HTMLInputElement).value
                    router.post(`/projects/${project.id}/mark_built`, { build_proof_url: url })
                  }}
                  className="space-y-3"
                >
                  <p className="text-stone-400 text-xs">Drop a link to a photo, video, or anything that shows you built this. Required to redeem direct grants and order shop items.</p>
                  <input
                    type="url"
                    name="build_proof_url"
                    placeholder="https://..."
                    required
                    className="w-full bg-[#0e0e0e] border-none px-4 py-3 text-[#e5e2e1] text-sm focus:ring-1 focus:ring-[#ee671c]/30 placeholder:text-stone-600"
                  />
                  <button
                    type="submit"
                    className="w-full signature-smolder text-[#4c1a00] font-headline font-bold py-3 uppercase tracking-wider text-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">check_circle</span>
                    Mark as Built
                  </button>
                </form>
              )}
            </div>
          )}

          <div className="bg-[#1c1b1b] ghost-border p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-[#ee671c] text-base">favorite</span>
              <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-stone-500 font-headline">Kudos ({kudos.length})</h4>
            </div>

            {can.give_kudos && (
              <form onSubmit={submitKudo} className="mb-4">
                <textarea
                  value={kudoContent}
                  onChange={(e) => setKudoContent(e.target.value)}
                  rows={2}
                  placeholder={`Drop ${project.user_display_name.split(' ')[0]} some kudos...`}
                  className="w-full bg-[#0e0e0e] border-none px-3 py-2 text-sm text-[#e5e2e1] focus:ring-1 focus:ring-[#ee671c]/30 placeholder:text-stone-600 resize-y mb-2"
                />
                <button
                  type="submit"
                  disabled={!kudoContent.trim()}
                  className="w-full signature-smolder text-[#4c1a00] py-2 text-[10px] font-bold uppercase tracking-[0.15em] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">favorite</span>
                  Send Kudos
                </button>
              </form>
            )}

            {kudos.length === 0 ? (
              <p className="text-stone-600 text-xs">No kudos yet.</p>
            ) : (
              <div className="space-y-2">
                {kudos.map((kudo) => (
                  <div key={kudo.id} className="bg-[#0e0e0e] ghost-border p-3 min-w-0 overflow-hidden">
                    <div className="flex items-start gap-2 mb-1">
                      <img src={kudo.author_avatar} alt={kudo.author_name} className="w-6 h-6 border border-white/10 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Link href={`/users/${kudo.author_id}`} className="text-[#e5e2e1] text-xs font-bold hover:text-[#ffb595] transition-colors truncate">
                            {kudo.author_name}
                          </Link>
                          {kudo.author_is_staff && (
                            <span className="text-[8px] font-bold uppercase tracking-wider px-1 py-0.5 bg-[#ee671c]/15 text-[#ee671c]">staff</span>
                          )}
                        </div>
                        <p className="text-[9px] uppercase tracking-[0.15em] text-stone-600">{kudo.created_at}</p>
                      </div>
                      {kudo.can_destroy && (
                        <button onClick={() => deleteKudo(kudo.id)} className="text-stone-600 hover:text-red-400 transition-colors shrink-0 cursor-pointer">
                          <span className="material-symbols-outlined text-xs">close</span>
                        </button>
                      )}
                    </div>
                    <p className="text-stone-300 text-xs leading-relaxed whitespace-pre-wrap break-words [overflow-wrap:anywhere] pl-8">
                      {kudo.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {(can.update || can.destroy) && (
            <div className="bg-[#1c1b1b] ghost-border p-6">
              <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-stone-500 font-headline mb-4">Manage</h4>
              <div className="flex flex-col gap-2">
                {can.update && (
                  <Link
                    href={`/projects/${project.id}/edit`}
                    className="w-full py-2.5 px-4 bg-[#2a2a2a] hover:bg-[#3a3939] flex items-center justify-between group transition-all"
                  >
                    <span className="text-sm font-headline font-medium text-[#e5e2e1]">Edit Project</span>
                    <span className="material-symbols-outlined text-stone-500 group-hover:text-[#ffb595] transition-colors text-lg">edit</span>
                  </Link>
                )}
                {can.destroy && (
                  <button
                    onClick={deleteProject}
                    className="w-full py-2.5 px-4 bg-red-950/20 hover:bg-red-950/40 flex items-center justify-between group transition-all border border-red-500/20 cursor-pointer"
                  >
                    <span className="text-sm font-headline font-medium text-red-400">Delete Project</span>
                    <span className="material-symbols-outlined text-red-500/50 group-hover:text-red-400 transition-colors text-lg">delete</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
