import { Head, Link } from '@inertiajs/react'

interface DashboardUser {
  display_name: string
  email: string
  avatar: string
  created_at: string
}

interface Stats {
  projects_count: number
  total_ships: number
  pending_ships: number
  approved_ships: number
  returned_ships: number
  rejected_ships: number
}

interface DashboardProject {
  id: number
  name: string
  subtitle: string | null
  ships_count: number
  pending_ships: number
  approved_ships: number
  updated_at: string
}

interface RecentShip {
  id: number
  project_name: string
  status: string
  feedback: string | null
  created_at: string
}

interface Props {
  user: DashboardUser
  stats: Stats
  projects: DashboardProject[]
  recent_ships: RecentShip[]
}

const statusConfig: Record<string, { label: string; bg: string; text: string; icon: string }> = {
  pending: { label: 'Pending', bg: 'bg-amber-500/10', text: 'text-amber-400', icon: 'schedule' },
  approved: { label: 'Approved', bg: 'bg-emerald-500/10', text: 'text-emerald-400', icon: 'check_circle' },
  returned: { label: 'Returned', bg: 'bg-orange-500/10', text: 'text-orange-400', icon: 'undo' },
  rejected: { label: 'Rejected', bg: 'bg-red-500/10', text: 'text-red-400', icon: 'cancel' },
}

export default function HomeIndex({ user, stats, projects, recent_ships }: Props) {
  return (
    <>
      <Head title="Dashboard — Forge" />
      <div className="p-12 max-w-7xl mx-auto space-y-12">
        <section className="flex flex-col md:flex-row justify-between items-end gap-8">
          <div className="space-y-4 max-w-2xl">
            <h1 className="text-5xl font-medium font-headline tracking-tight text-white leading-tight">
              Project<br /><span className="text-[#ee671c]">Dashboard</span>
            </h1>
            <p className="text-stone-400 text-lg leading-relaxed">
              Track your builds, monitor ship status, and manage your hardware projects.
            </p>
          </div>
          <div className="flex gap-4">
            <div className="bg-[#1c1b1b] p-6 rounded-lg ghost-border min-w-[140px]">
              <p className="text-stone-500 text-[10px] uppercase tracking-widest mb-1">Projects</p>
              <p className="text-3xl font-bold font-headline text-white">{stats.projects_count}</p>
            </div>
            <div className="bg-[#1c1b1b] p-6 rounded-lg ghost-border min-w-[140px]">
              <p className="text-stone-500 text-[10px] uppercase tracking-widest mb-1">Approved</p>
              <p className="text-3xl font-bold font-headline text-[#ffb595]">{stats.approved_ships}</p>
            </div>
          </div>
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
                <p className="text-stone-500 text-sm mb-6">Start a project to begin earning heat.</p>
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
                        <div className="flex items-center gap-3">
                          {project.pending_ships > 0 && (
                            <span className="bg-[#7a2e25] text-[#ff9a8b] px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 bg-[#ffb595] rounded-full" />
                              {project.pending_ships} pending
                            </span>
                          )}
                          {project.approved_ships > 0 && (
                            <span className="bg-emerald-500/10 text-emerald-400 px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded">
                              {project.approved_ships} approved
                            </span>
                          )}
                        </div>
                        <h3 className="text-xl font-bold font-headline text-white group-hover:text-[#ffb595] transition-colors truncate">
                          {project.name}
                        </h3>
                        {project.subtitle && (
                          <p className="text-stone-500 text-sm line-clamp-1">{project.subtitle}</p>
                        )}
                      </div>
                      <div className="text-right shrink-0 space-y-1">
                        <p className="text-stone-500 text-xs">{project.ships_count} ships</p>
                        <p className="text-[10px] text-stone-600 uppercase tracking-widest">{project.updated_at}</p>
                      </div>
                    </div>

                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-4 space-y-8">
            {stats.total_ships > 0 && (
              <div className="bg-[#1c1b1b] ghost-border p-8 rounded-xl">
                <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-stone-500 font-headline mb-6">Ship Status</h4>
                <div className="space-y-4">
                  {Object.entries(statusConfig)
                    .filter(([key]) => stats[`${key}_ships` as keyof Stats] as number > 0)
                    .map(([key, config]) => {
                      const count = stats[`${key}_ships` as keyof Stats] as number
                      const pct = Math.round((count / stats.total_ships) * 100)
                      return (
                        <div key={key} className="space-y-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-stone-300 flex items-center gap-2">
                              <span className={`material-symbols-outlined text-sm ${config.text}`}>{config.icon}</span>
                              {config.label}
                            </span>
                            <span className="text-stone-500">{count} ({pct}%)</span>
                          </div>
                          <div className="h-1 bg-[#0e0e0e] rounded-full overflow-hidden">
                            <div className={`h-full ${config.bg.replace('/10', '')} rounded-full`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      )
                    })}
                </div>
              </div>
            )}

            <div className="bg-[#1c1b1b] ghost-border p-8 rounded-xl">
              <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-stone-500 font-headline mb-6">Recent Activity</h4>
              {recent_ships.length === 0 ? (
                <p className="text-stone-600 text-sm">No ships yet. Submit a project to see activity here.</p>
              ) : (
                <div className="space-y-4">
                  {recent_ships.map((ship) => {
                    const config = statusConfig[ship.status] || statusConfig.pending
                    return (
                      <div key={ship.id} className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`material-symbols-outlined text-sm ${config.text}`}>{config.icon}</span>
                          <span className={`text-xs font-bold uppercase tracking-wider ${config.text}`}>{ship.status}</span>
                        </div>
                        <p className="text-stone-300 text-sm font-medium truncate">{ship.project_name}</p>
                        {ship.feedback && (
                          <p className="text-stone-500 text-xs line-clamp-2">{ship.feedback}</p>
                        )}
                        <p className="text-stone-600 text-[10px] uppercase tracking-widest">{ship.created_at}</p>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

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
