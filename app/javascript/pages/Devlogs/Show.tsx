import { Head, Link, router } from '@inertiajs/react'
import Markdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import remarkGfm from 'remark-gfm'

const statusConfig: Record<string, { label: string; bg: string; text: string; icon: string }> = {
  draft: { label: 'Draft', bg: 'bg-stone-500/10', text: 'text-stone-400', icon: 'edit_note' },
  pending: { label: 'Under Review', bg: 'bg-amber-500/10', text: 'text-amber-400', icon: 'schedule' },
  approved: { label: 'Approved', bg: 'bg-emerald-500/10', text: 'text-emerald-400', icon: 'check_circle' },
  returned: { label: 'Needs Work', bg: 'bg-orange-500/10', text: 'text-orange-400', icon: 'undo' },
}

interface Props {
  project: {
    id: number
    name: string
    user_display_name: string
    user_avatar: string
    user_id: number
  }
  devlog: {
    id: number
    title: string
    content: string
    time_spent: string | null
    status: string
    approved_hours: number | null
    review_feedback: string | null
    reviewer_display_name: string | null
    reviewed_at: string | null
    created_at: string
  }
  can_edit: boolean
}

export default function DevlogsShow({ project, devlog, can_edit }: Props) {
  const st = statusConfig[devlog.status] || statusConfig.draft

  return (
    <>
      <Head title={`${devlog.title} — ${project.name} — Forge`} />
      <div className="p-5 md:p-12 max-w-4xl mx-auto">
        <Link
          href={`/projects/${project.id}`}
          className="text-stone-500 text-sm hover:text-[#ffb595] transition-colors flex items-center gap-1 mb-8"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Back to {project.name}
        </Link>

        <header className="ghost-border bg-[#1c1b1b] p-8 mb-8">
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className={`${st.bg} ${st.text} px-3 py-1 text-[10px] uppercase font-bold tracking-widest flex items-center gap-1.5`}>
              <span className="material-symbols-outlined text-sm">{st.icon}</span>
              {st.label}
            </span>
            {devlog.time_spent && (
              <span className="text-[#ffb595] text-xs flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">schedule</span>
                {devlog.approved_hours != null ? `${devlog.approved_hours}h approved (claimed ${devlog.time_spent})` : devlog.time_spent}
              </span>
            )}
          </div>

          <h1 className="text-3xl md:text-4xl font-headline font-bold text-[#e5e2e1] tracking-tight mb-3">
            {devlog.title}
          </h1>

          <div className="flex items-center gap-4 text-xs text-stone-500">
            <Link
              href={`/users/${project.user_id}`}
              className="flex items-center gap-2 text-stone-400 hover:text-[#ffb595] transition-colors"
            >
              <img src={project.user_avatar} alt={project.user_display_name} className="w-5 h-5 border border-white/10" />
              <span>{project.user_display_name}</span>
            </Link>
            <span>{devlog.created_at}</span>
            {devlog.reviewer_display_name && (
              <span className="text-stone-600">Reviewed by {devlog.reviewer_display_name} on {devlog.reviewed_at}</span>
            )}
          </div>
        </header>

        {devlog.review_feedback && devlog.status === 'returned' && (
          <div className="bg-orange-500/10 ghost-border p-6 mb-8 flex items-start gap-3">
            <span className="material-symbols-outlined text-orange-400 text-lg shrink-0 mt-0.5">feedback</span>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-orange-400 font-headline mb-2">Reviewer Feedback</h4>
              <p className="text-stone-300 text-sm leading-relaxed">{devlog.review_feedback}</p>
            </div>
          </div>
        )}

        <article className="ghost-border bg-[#1c1b1b] p-8 mb-8">
          <div className="prose prose-invert prose-sm max-w-none text-stone-300 prose-a:text-[#ffb595] prose-img:max-w-full prose-img:rounded-none break-words [overflow-wrap:anywhere]">
            <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>{devlog.content}</Markdown>
          </div>
        </article>

        {can_edit && (
          <div className="flex gap-3">
            <button
              onClick={() => router.post(`/projects/${project.id}/devlogs/${devlog.id}/submit_for_review`)}
              className="signature-smolder text-[#4c1a00] px-5 py-2 text-xs font-bold uppercase tracking-[0.15em] cursor-pointer flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-base">send</span>
              Submit for Review
            </button>
          </div>
        )}
      </div>
    </>
  )
}
