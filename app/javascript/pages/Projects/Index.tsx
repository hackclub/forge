import { useState } from 'react'
import { router, Link } from '@inertiajs/react'
import Pagination from '@/components/Pagination'
import type { ProjectCard, PagyProps, ProjectStatus } from '@/types'

const statusConfig: Record<ProjectStatus, { label: string; text: string }> = {
  draft: { label: 'Draft', text: 'text-stone-400' },
  pending: { label: 'Pending', text: 'text-amber-400' },
  approved: { label: 'Approved', text: 'text-emerald-400' },
  returned: { label: 'Returned', text: 'text-orange-400' },
  rejected: { label: 'Rejected', text: 'text-red-400' },
}

export default function ProjectsIndex({
  projects,
  pagy,
  query,
}: {
  projects: ProjectCard[]
  pagy: PagyProps
  query: string
}) {
  const [searchQuery, setSearchQuery] = useState(query)

  function search(e: React.FormEvent) {
    e.preventDefault()
    router.get('/projects', { query: searchQuery }, { preserveState: true })
  }

  return (
    <div className="p-12 max-w-[1400px] mx-auto">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 gap-4">
        <h1 className="text-4xl font-headline font-bold text-[#e5e2e1] tracking-tight">Projects</h1>
        <div className="flex gap-3 items-center w-full md:w-auto">
          <form onSubmit={search} className="flex gap-2 flex-1">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects..."
              className="bg-[#0e0e0e] border-none rounded-lg px-4 py-2 text-sm text-[#e5e2e1] focus:ring-1 focus:ring-[#ee671c]/30 placeholder:text-stone-600 flex-1"
            />
            <button type="submit" className="bg-[#2a2a2a] text-[#e5e2e1] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#3a3939] transition-colors border border-white/5 cursor-pointer">
              Search
            </button>
          </form>
          <Link
            href="/projects/new"
            className="signature-smolder text-[#4c1a00] px-5 py-2 rounded-lg font-headline font-bold text-sm uppercase tracking-wider shrink-0 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            New
          </Link>
        </div>
      </div>

      {projects.length > 0 ? (
        <>
          <div className="space-y-4">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="block bg-[#1c1b1b] p-6 rounded-xl ghost-border hover:bg-[#2a2a2a] transition-all duration-300 group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="text-xl font-headline font-bold text-white group-hover:text-[#ffb595] transition-colors truncate">
                      {project.name}
                    </h2>
                    {project.description && (
                      <p className="text-stone-500 text-sm mt-1 line-clamp-1">{project.description}</p>
                    )}
                    {project.tags.length > 0 && (
                      <div className="flex gap-2 mt-3 flex-wrap">
                        {project.tags.map((tag) => (
                          <span key={tag} className="px-2 py-1 bg-[#0e0e0e] text-[10px] rounded text-stone-400 uppercase tracking-wider">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-stone-500 shrink-0">
                    <span className={`text-xs font-bold uppercase tracking-wider ${statusConfig[project.status]?.text || 'text-stone-500'}`}>
                      {statusConfig[project.status]?.label || project.status}
                    </span>
                    <span className="text-stone-600">·</span>
                    <span>{project.user_display_name}</span>
                    <span className="material-symbols-outlined text-stone-600 group-hover:text-[#ffb595] transition-colors">arrow_forward</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <Pagination pagy={pagy} />
        </>
      ) : (
        <div className="bg-[#1c1b1b] rounded-xl ghost-border p-16 text-center">
          <p className="text-stone-300 text-lg font-headline font-medium mb-2">No projects yet</p>
          <p className="text-stone-500 text-sm">Create your first project to get started.</p>
        </div>
      )}
    </div>
  )
}
