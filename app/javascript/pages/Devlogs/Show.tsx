import { Head, Link } from '@inertiajs/react'
import Markdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import remarkGfm from 'remark-gfm'

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
    created_at: string
  }
  can_edit: boolean
}

export default function DevlogsShow({ project, devlog }: Props) {
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
          {devlog.time_spent && (
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <span className="text-[#ffb595] text-xs flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">schedule</span>
                {devlog.time_spent}
              </span>
            </div>
          )}

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
          </div>
        </header>

        <article className="ghost-border bg-[#1c1b1b] p-8 mb-8">
          <div className="prose prose-invert prose-sm max-w-none text-stone-300 prose-a:text-[#ffb595] prose-img:max-w-full prose-img:rounded-none break-words [overflow-wrap:anywhere]">
            <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>{devlog.content}</Markdown>
          </div>
        </article>
      </div>
    </>
  )
}
