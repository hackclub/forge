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
  description: string | null
  tags: string[]
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

function StatBlock({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="border border-yellow-800/30 bg-yellow-950/20 p-5 relative group hover:border-yellow-700/50 transition-all">
      <span className="absolute top-0 left-0 w-2 h-2 border-t border-l border-yellow-700/40 group-hover:border-yellow-600/60 transition-colors" />
      <span className="absolute top-0 right-0 w-2 h-2 border-t border-r border-yellow-700/40 group-hover:border-yellow-600/60 transition-colors" />
      <span className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-yellow-700/40 group-hover:border-yellow-600/60 transition-colors" />
      <span className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-yellow-700/40 group-hover:border-yellow-600/60 transition-colors" />
      <p className="text-2xl font-black bg-gradient-to-b from-yellow-400 via-yellow-600 to-yellow-800 bg-clip-text text-transparent">{value}</p>
      <p className="text-yellow-100/20 text-[10px] uppercase tracking-[0.3em] font-bold mt-1">{label}</p>
    </div>
  )
}

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-500',
    approved: 'bg-green-500',
    returned: 'bg-orange-500',
    rejected: 'bg-red-500',
  }
  return <span className={`inline-block w-2 h-2 rounded-full ${colors[status] || 'bg-gray-500'}`} />
}

export default function HomeIndex({ user, stats, projects, recent_ships }: Props) {
  return (
    <>
      <Head title="Dashboard — Quarry" />
      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <img
              src={user.avatar}
              alt={user.display_name}
              className="w-12 h-12 border border-yellow-800/40"
            />
            <div>
              <h1 className="text-xl font-black text-yellow-100/90 tracking-tight">{user.display_name}</h1>
              <p className="text-yellow-100/25 text-sm">{user.email}</p>
            </div>
          </div>
          <Link
            href="/projects/new"
            className="relative bg-gradient-to-b from-yellow-600 to-yellow-800 hover:from-yellow-500 hover:to-yellow-700 text-[#1a1200] font-black px-6 py-2.5 text-sm uppercase tracking-[0.15em] transition-all shadow-[0_0_20px_rgba(180,130,20,0.1)] hover:shadow-[0_0_30px_rgba(180,130,20,0.25)] border border-yellow-500/30"
          >
            <span className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-yellow-400/50" />
            <span className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-yellow-400/50" />
            <span className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-yellow-400/50" />
            <span className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-yellow-400/50" />
            <span className="relative z-10">+ New Project</span>
          </Link>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3 mb-10">
          <StatBlock value={stats.projects_count} label="Projects" />
          <StatBlock value={stats.total_ships} label="Ships" />
          <StatBlock value={stats.approved_ships} label="Approved" />
        </div>

        <div className="grid sm:grid-cols-3 gap-6">
          {/* Projects list — takes 2 columns */}
          <div className="sm:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <p className="text-yellow-700/60 text-[10px] uppercase tracking-[0.4em] font-bold">Your Claims</p>
              <Link href="/projects" className="text-yellow-600/50 hover:text-yellow-500 text-xs uppercase tracking-wider transition-colors">
                View All
              </Link>
            </div>

            {projects.length === 0 ? (
              <div className="border border-yellow-800/20 bg-yellow-950/10 p-12 text-center">
                <p className="text-yellow-100/30 text-lg font-bold mb-2">No claims staked yet</p>
                <p className="text-yellow-100/15 text-sm mb-6">Start a project to begin mining your funding.</p>
                <Link
                  href="/projects/new"
                  className="inline-block border border-yellow-800/40 hover:border-yellow-600/50 text-yellow-100/40 hover:text-yellow-400 font-bold px-6 py-2.5 text-sm uppercase tracking-wider transition-all"
                >
                  Stake Your First Claim
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {projects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="block border border-yellow-800/20 bg-yellow-950/10 p-5 hover:border-yellow-700/40 transition-all group relative"
                  >
                    <span className="absolute top-0 left-0 w-2 h-2 border-t border-l border-yellow-700/30 group-hover:border-yellow-600/50 transition-colors" />
                    <span className="absolute top-0 right-0 w-2 h-2 border-t border-r border-yellow-700/30 group-hover:border-yellow-600/50 transition-colors" />
                    <span className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-yellow-700/30 group-hover:border-yellow-600/50 transition-colors" />
                    <span className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-yellow-700/30 group-hover:border-yellow-600/50 transition-colors" />

                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h3 className="font-black text-yellow-100/80 group-hover:text-yellow-100/95 transition-colors truncate">{project.name}</h3>
                        {project.description && (
                          <p className="text-yellow-100/20 text-sm mt-1 line-clamp-1">{project.description}</p>
                        )}
                        {project.tags.length > 0 && (
                          <div className="flex gap-2 mt-2 flex-wrap">
                            {project.tags.map((tag) => (
                              <span key={tag} className="text-[10px] uppercase tracking-wider text-yellow-600/50 border border-yellow-800/20 px-2 py-0.5">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-yellow-100/30 text-xs">{project.ships_count} ships</p>
                        <p className="text-yellow-100/15 text-[10px] mt-0.5">{project.updated_at}</p>
                      </div>
                    </div>

                    {(project.pending_ships > 0 || project.approved_ships > 0) && (
                      <div className="flex gap-3 mt-3 text-[10px] uppercase tracking-wider">
                        {project.pending_ships > 0 && (
                          <span className="text-yellow-500/60 flex items-center gap-1">
                            <StatusDot status="pending" /> {project.pending_ships} pending
                          </span>
                        )}
                        {project.approved_ships > 0 && (
                          <span className="text-green-500/60 flex items-center gap-1">
                            <StatusDot status="approved" /> {project.approved_ships} approved
                          </span>
                        )}
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Recent activity — 1 column */}
          <div>
            <p className="text-yellow-700/60 text-[10px] uppercase tracking-[0.4em] font-bold mb-4">Recent Activity</p>

            {recent_ships.length === 0 ? (
              <div className="border border-yellow-800/20 bg-yellow-950/10 p-6 text-center">
                <p className="text-yellow-100/20 text-sm">No ships yet.</p>
                <p className="text-yellow-100/12 text-xs mt-1">Ship a project to see activity here.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recent_ships.map((ship) => (
                  <div key={ship.id} className="border border-yellow-800/15 bg-yellow-950/10 p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <StatusDot status={ship.status} />
                      <span className="text-yellow-100/50 text-xs font-bold uppercase tracking-wider">{ship.status}</span>
                    </div>
                    <p className="text-yellow-100/60 text-sm font-bold truncate">{ship.project_name}</p>
                    {ship.feedback && (
                      <p className="text-yellow-100/20 text-xs mt-1 line-clamp-2">{ship.feedback}</p>
                    )}
                    <p className="text-yellow-100/12 text-[10px] mt-2 uppercase tracking-wider">{ship.created_at}</p>
                  </div>
                ))}
              </div>
            )}

            {stats.total_ships > 0 && (
              <div className="mt-4 border border-yellow-800/15 bg-yellow-950/10 p-4">
                <p className="text-yellow-700/50 text-[10px] uppercase tracking-[0.3em] font-bold mb-3">Ship Breakdown</p>
                <div className="space-y-2">
                  {[
                    { label: 'Pending', count: stats.pending_ships, color: 'bg-yellow-500' },
                    { label: 'Approved', count: stats.approved_ships, color: 'bg-green-500' },
                    { label: 'Returned', count: stats.returned_ships, color: 'bg-orange-500' },
                    { label: 'Rejected', count: stats.rejected_ships, color: 'bg-red-500' },
                  ].filter(s => s.count > 0).map((s) => (
                    <div key={s.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${s.color}`} />
                        <span className="text-yellow-100/30 text-xs">{s.label}</span>
                      </div>
                      <span className="text-yellow-100/50 text-xs font-bold">{s.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
