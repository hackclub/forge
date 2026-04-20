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

interface StaffPick {
  id: number
  name: string
  subtitle: string | null
  cover_image_url: string | null
  user_id: number
  user_display_name: string
  user_avatar: string
}

interface Props {
  user: DashboardUser
  stats: Stats
  projects: DashboardProject[]
  news_posts: NewsPostSummary[]
  staff_picks: StaffPick[]
}

const STATUS_LABELS: Record<ProjectStatus, string> = {
  draft: 'Draft',
  pending: 'Pending',
  approved: 'Approved',
  returned: 'Returned',
  rejected: 'Rejected',
  build_pending: 'Build Pending',
  build_approved: 'Build Approved',
  pitch_approved: 'Pitch Approved',
  pitch_pending: 'Pitch Review',
}

const STATUS_COLORS: Record<ProjectStatus, string> = {
  draft: 'bg-stone-500/15 text-stone-400',
  pending: 'bg-amber-500/15 text-amber-400',
  approved: 'bg-emerald-500/15 text-emerald-400',
  returned: 'bg-orange-500/15 text-orange-400',
  rejected: 'bg-red-500/15 text-red-400',
  build_pending: 'bg-amber-500/15 text-amber-400',
  build_approved: 'bg-emerald-500/15 text-emerald-400',
  pitch_approved: 'bg-emerald-500/15 text-emerald-400',
  pitch_pending: 'bg-amber-500/15 text-amber-400',
}

export default function HomeIndex({ user, projects, news_posts, staff_picks }: Props) {
  return (
    <>
      <Head title="Dashboard — Forge" />
      <div className="p-5 md:p-12 max-w-6xl mx-auto space-y-10">
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
              <span
                className="material-symbols-outlined text-6xl text-[#ee671c] mb-4 block"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                precision_manufacturing
              </span>
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
                  <div className="aspect-[16/10] overflow-hidden bg-[#1c1b1b]">
                    <img
                      src={project.cover_image_url || '/orph-building.png'}
                      alt={project.name}
                      className="w-full h-full object-cover"
                    />
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

        {staff_picks.length > 0 && (
          <section className="bg-[#1c1b1b] ghost-border p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-headline font-bold text-[#e5e2e1] tracking-tight">Staff picks</h2>
              <Link
                href="/explore"
                className="text-xs font-bold uppercase tracking-[0.2em] text-stone-500 hover:text-[#ffb595] transition-colors flex items-center gap-1"
              >
                Explore all
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {staff_picks.map((pick) => (
                <div
                  key={pick.id}
                  className="group bg-[#0e0e0e] ghost-border hover:bg-[#161616] transition-colors flex flex-col min-w-0 overflow-hidden"
                >
                  <Link href={`/projects/${pick.id}`} className="block">
                    <div className="aspect-[16/10] overflow-hidden bg-[#1c1b1b]">
                      <img
                        src={pick.cover_image_url || '/orph-building.png'}
                        alt={pick.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-5 pb-3">
                      <h3 className="font-headline font-bold text-[#e5e2e1] group-hover:text-[#ffb595] transition-colors tracking-tight mb-2 break-words">
                        {pick.name}
                      </h3>
                      {pick.subtitle && (
                        <p className="text-stone-500 text-xs line-clamp-2 break-words">{pick.subtitle}</p>
                      )}
                    </div>
                  </Link>
                  <Link
                    href={`/users/${pick.user_id}`}
                    className="px-5 pb-5 mt-auto pt-2 flex items-center gap-2 text-stone-500 hover:text-[#ffb595] transition-colors"
                  >
                    <img
                      src={pick.user_avatar}
                      alt={pick.user_display_name}
                      className="w-5 h-5 rounded-full border border-white/10"
                    />
                    <span className="text-[10px] uppercase tracking-widest truncate">
                      by {pick.user_display_name}
                    </span>
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}

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
              {news_posts.map((post) => (
                <Link
                  key={post.id}
                  href={`/news/${post.id}`}
                  className="block bg-[#0e0e0e] ghost-border p-6 hover:bg-[#161616] transition-colors group min-w-0 overflow-hidden"
                >
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500 mb-2">
                    {post.published_at}
                  </p>
                  <h3 className="font-headline font-bold text-lg tracking-tight text-[#e5e2e1] group-hover:text-[#ffb595] transition-colors mb-2 break-words">
                    {post.title}
                  </h3>
                  <div
                    className="markdown-content text-sm leading-relaxed text-stone-400 line-clamp-3 break-words [overflow-wrap:anywhere] !max-w-none !mx-0 !my-0 !px-0"
                    dangerouslySetInnerHTML={{ __html: post.body_html }}
                  />
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  )
}
