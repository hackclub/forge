import { Head, Link } from '@inertiajs/react'
import type { ProjectStatus, NewsPostSummary } from '@/types'

interface DashboardUser {
  display_name: string
  email: string
  avatar: string
  created_at: string
}

interface Stats {
  projects_count: number
}

interface DashboardProject {
  id: number
  name: string
  subtitle: string | null
  status: ProjectStatus
  cover_image_url: string | null
  updated_at: string
}

interface Props {
  user: DashboardUser
  stats: Stats
  projects: DashboardProject[]
  news_posts: NewsPostSummary[]
}

const STATUS_LABELS: Record<ProjectStatus, string> = {
  draft: 'Draft',
  pending: 'Pending',
  approved: 'Approved',
  returned: 'Returned',
  rejected: 'Rejected',
  build_pending: 'Build Pending',
  build_approved: 'Build Approved',
}

const STATUS_COLORS: Record<ProjectStatus, string> = {
  draft: 'bg-stone-500/15 text-stone-400',
  pending: 'bg-amber-500/15 text-amber-400',
  approved: 'bg-emerald-500/15 text-emerald-400',
  returned: 'bg-orange-500/15 text-orange-400',
  rejected: 'bg-red-500/15 text-red-400',
  build_pending: 'bg-amber-500/15 text-amber-400',
  build_approved: 'bg-emerald-500/15 text-emerald-400',
}

export default function HomeIndex({ user, projects, news_posts }: Props) {
  return (
    <>
      <Head title="Dashboard — Forge" />
      <div className="p-12 max-w-6xl mx-auto space-y-10">
        <section>
          <h1 className="text-5xl font-headline font-bold tracking-tight text-[#e5e2e1] mb-2">
            Dashboard
          </h1>
          <p className="text-stone-500">Here's what the forge is forging today, {user.display_name.split(' ')[0]}.</p>
        </section>

        <section className="bg-[#1c1b1b] ghost-border p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-headline font-bold text-[#e5e2e1] tracking-tight">Your projects</h2>
            <Link
              href="/projects/new"
              className="signature-smolder text-[#4c1a00] px-4 py-2 font-bold uppercase tracking-wider text-xs flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-base">add</span>
              New Project
            </Link>
          </div>

          {projects.length === 0 ? (
            <div className="p-16 text-center">
              <span className="material-symbols-outlined text-5xl text-stone-700 mb-4">rocket_launch</span>
              <p className="text-stone-300 text-lg font-headline font-medium mb-2">No projects yet</p>
              <p className="text-stone-500 text-sm mb-6">Start a project to begin your build.</p>
              <Link
                href="/projects/new"
                className="signature-smolder text-[#4c1a00] px-6 py-3 font-headline font-bold uppercase tracking-wider text-xs inline-flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">add</span>
                Create Your First Project
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="group bg-[#0e0e0e] ghost-border hover:bg-[#161616] transition-colors flex flex-col"
                >
                  <div className="aspect-[16/10] overflow-hidden bg-[#1c1b1b] flex items-center justify-center">
                    {project.cover_image_url ? (
                      <img src={project.cover_image_url} alt={project.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="material-symbols-outlined text-5xl text-stone-800 group-hover:text-stone-700 transition-colors">
                        precision_manufacturing
                      </span>
                    )}
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="font-headline font-bold text-[#e5e2e1] group-hover:text-[#ffb595] transition-colors tracking-tight truncate">
                        {project.name}
                      </h3>
                      <span className={`shrink-0 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 ${STATUS_COLORS[project.status]}`}>
                        {STATUS_LABELS[project.status]}
                      </span>
                    </div>
                    {project.subtitle && (
                      <p className="text-stone-500 text-xs line-clamp-2 mb-4">{project.subtitle}</p>
                    )}
                    <p className="text-[10px] text-stone-600 uppercase tracking-widest mt-auto">
                      Updated {project.updated_at}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="bg-[#1c1b1b] ghost-border p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-headline font-bold text-[#e5e2e1] tracking-tight">Latest news</h2>
            <Link
              href="/news"
              className="text-xs font-bold uppercase tracking-[0.2em] text-stone-500 hover:text-[#ffb595] transition-colors flex items-center gap-1"
            >
              View all
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>

          {news_posts.length === 0 ? (
            <div className="p-12 text-center">
              <span className="material-symbols-outlined text-5xl text-stone-700 mb-4">campaign</span>
              <p className="text-stone-500 text-sm">No news yet. Check back soon.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {news_posts.map((post, idx) => (
                <article
                  key={post.id}
                  className={
                    idx === 0
                      ? 'signature-smolder p-6 text-[#4c1a00]'
                      : 'bg-[#0e0e0e] ghost-border p-6'
                  }
                >
                  <p className={`text-[10px] font-bold uppercase tracking-[0.2em] mb-2 ${idx === 0 ? 'text-[#4c1a00]/70' : 'text-stone-600'}`}>
                    {idx === 0 ? 'Program Announcement · ' : ''}{post.published_at}
                  </p>
                  <h3 className={`font-headline font-bold text-lg tracking-tight mb-2 ${idx === 0 ? 'text-[#4c1a00]' : 'text-[#e5e2e1]'}`}>
                    {post.title}
                  </h3>
                  <p className={`text-sm leading-relaxed whitespace-pre-wrap ${idx === 0 ? 'text-[#4c1a00]/90' : 'text-stone-400'}`}>
                    {post.body}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  )
}
