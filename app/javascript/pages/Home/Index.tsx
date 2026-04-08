import { Head, Link } from '@inertiajs/react'

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
  updated_at: string
}

interface Props {
  user: DashboardUser
  stats: Stats
  projects: DashboardProject[]
}

export default function HomeIndex({ user, stats, projects }: Props) {
  return (
    <>
      <Head title="Dashboard — Forge" />
      <div className="p-12 max-w-7xl mx-auto space-y-12">
        <section>
          <h1 className="text-5xl font-medium font-headline tracking-tight text-white leading-tight mb-2">
            Forge <span className="text-[#ee671c]">Dashboard</span>
          </h1>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-stone-500 font-headline">Your Projects</h2>
            </div>

            {projects.length === 0 ? (
              <div className="bg-[#1c1b1b] rounded-xl ghost-border p-16 text-center">
                <span className="material-symbols-outlined text-5xl text-stone-700 mb-4">rocket_launch</span>
                <p className="text-stone-300 text-lg font-headline font-medium mb-2">No projects yet</p>
                <p className="text-stone-500 text-sm mb-6">Start a project to begin your build.</p>
                <Link
                  href="/projects/new"
                  className="signature-smolder text-[#4c1a00] px-6 py-3 rounded-lg font-headline font-bold uppercase tracking-wider inline-flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-lg">add</span>
                  Create Your First Project
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {projects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="block bg-[#1c1b1b] p-6 rounded-xl ghost-border hover:bg-[#2a2a2a] transition-all duration-300 group"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-2 min-w-0">
                        <h3 className="text-xl font-bold font-headline text-white group-hover:text-[#ffb595] transition-colors truncate">
                          {project.name}
                        </h3>
                        {project.subtitle && (
                          <p className="text-stone-500 text-sm line-clamp-1">{project.subtitle}</p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[10px] text-stone-600 uppercase tracking-widest">{project.updated_at}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-4 space-y-8">
            <div className="bg-[#0e0e0e] ghost-border p-8 rounded-xl">
              <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-stone-500 font-headline mb-6">Quick Actions</h4>
              <div className="flex flex-col gap-3">
                <Link
                  href="/projects/new"
                  className="w-full py-3 px-4 bg-[#2a2a2a] hover:bg-[#3a3939] rounded-lg flex items-center justify-between group transition-all btn-bracket"
                >
                  <span className="text-sm font-headline font-medium text-[#e5e2e1]">New Project</span>
                  <span className="material-symbols-outlined text-stone-500 group-hover:text-[#ffb595] transition-colors">add_circle</span>
                </Link>
                <Link
                  href="/explore"
                  className="w-full py-3 px-4 bg-[#2a2a2a] hover:bg-[#3a3939] rounded-lg flex items-center justify-between group transition-all btn-bracket"
                >
                  <span className="text-sm font-headline font-medium text-[#e5e2e1]">Explore Projects</span>
                  <span className="material-symbols-outlined text-stone-500 group-hover:text-[#ffb595] transition-colors">explore</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
