import { Head, Link } from '@inertiajs/react'
import type { ProjectStatus, NewsPostSummary } from '@/types'
import ForgeKeeper from '@/components/ForgeKeeper'

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

interface OrphMotivation {
  approved_count: number
  goal: number
  dino_image: string
}

interface Props {
  user: DashboardUser
  stats: Stats
  orph_motivation: OrphMotivation
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
  pitch_approved: 'Pitch Approved',
  pitch_pending: 'Pitch Review',
}

const STATUS_COLORS: Record<ProjectStatus, string> = {
  draft: 'bg-stone-500/15 text-stone-400',
  pending: 'bg-amber-500/15 text-amber-400',
  approved: 'bg-emerald-500/15 text-emerald-400',
  returned: 'bg-orange-500/15 text-orange-400',
  rejected: 'bg-red-500/15 text-red-400',
  pitch_approved: 'bg-emerald-500/15 text-emerald-400',
  pitch_pending: 'bg-amber-500/15 text-amber-400',
}

export default function HomeIndex({ user, orph_motivation, projects, news_posts, staff_picks }: Props) {
  const orphProgress = Math.min(100, (orph_motivation.approved_count / orph_motivation.goal) * 100)
  const orphReached = orph_motivation.approved_count >= orph_motivation.goal

  return (
    <>
      <Head title="Dashboard - Forge" />
      <div className="p-5 md:p-12 max-w-6xl mx-auto space-y-10">
        <section className="flex items-start justify-between gap-3 sm:gap-4 relative">
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl sm:text-5xl font-headline font-bold tracking-tight text-[#e5e2e1] mb-2">Dashboard</h1>
            <p className="text-stone-500 text-sm sm:text-base">Here's what the forge is forging today, {user.display_name.split(' ')[0]}.</p>
            <Link
              href="/referrals"
              className="mt-4 inline-flex items-center gap-2 ghost-border bg-[#1c1b1b] hover:bg-[#2a2a2a] text-stone-400 hover:text-[#ffb595] px-3 py-1.5 uppercase tracking-wider text-[10px] font-bold transition-colors"
            >
              <span className="material-symbols-outlined text-sm">group_add</span>
              View referrals
            </Link>
          </div>
          <div className="relative shrink-0">
            <ForgeKeeper userName={user.display_name.split(' ')[0]} />
          </div>
        </section>

        <section
          data-tour="dashboard-quest"
          className="bg-[#1c1b1b] ghost-border p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6"
        >
          <img
            src={orph_motivation.dino_image}
            alt="Orph the dino"
            className="w-28 h-28 sm:w-32 sm:h-32 object-contain shrink-0"
          />
          <div className="flex-1 w-full min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-500">Orph's motivation</p>
              <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 bg-[#ee671c]/15 text-[#ffb595]">
                <span className="material-symbols-outlined text-[11px]">flag</span>
                Quest
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-headline font-bold text-[#e5e2e1] tracking-tight mb-2">
              {orphReached ? 'The forge did it — Orph is grinning again!' : 'Help cheer Orph back up'}
            </h2>
            <p className="text-stone-400 text-sm mb-4">
              Orph was tinkering away in his workshop when his project crashed and shattered to pieces. Orph got very very sad. As a community our goal is to build 100 projects together and cheer him up and show him that he can make cool stuff too!
            </p>
            <div className="h-3 bg-[#0e0e0e] ghost-border overflow-hidden">
              <div
                className="h-full signature-smolder transition-all duration-500"
                style={{ width: `${orphProgress}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-500">
                {orph_motivation.approved_count} / {orph_motivation.goal} projects
              </span>
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#ffb595]">
                {Math.floor(orphProgress)}%
              </span>
            </div>
          </div>
        </section>

        <section data-tour="dashboard-projects" className="bg-[#1c1b1b] ghost-border p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-headline font-bold text-[#e5e2e1] tracking-tight">Your projects</h2>
            <Link
              href="/projects/new"
              data-tour="dashboard-new-project"
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
                      <span
                        className={`shrink-0 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 ${STATUS_COLORS[project.status]}`}
                      >
                        {STATUS_LABELS[project.status]}
                      </span>
                    </div>
                    {project.subtitle && <p className="text-stone-500 text-xs line-clamp-2 mb-4">{project.subtitle}</p>}
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
                    <span className="text-[10px] uppercase tracking-widest truncate">by {pick.user_display_name}</span>
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
