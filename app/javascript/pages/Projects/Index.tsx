import { useState } from 'react'
import { router, Link } from '@inertiajs/react'
import Pagination from '@/components/Pagination'
import type { ProjectCard, PagyProps } from '@/types'

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
    <div className="max-w-4xl mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-black text-yellow-100/90 tracking-tight text-4xl">Projects</h1>
        <Link href="/projects/new" className="bg-gradient-to-b from-yellow-600 to-yellow-800 hover:from-yellow-500 hover:to-yellow-700 text-[#1a1200] font-black uppercase tracking-wider px-4 py-2">
          New Project
        </Link>
      </div>

      <form onSubmit={search} className="mb-6">
        <div className="flex gap-2">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects..."
            className="bg-yellow-950/20 border border-yellow-800/30 text-yellow-100/80 placeholder-yellow-100/15 focus:border-yellow-600/50 focus:outline-none px-3 py-2 flex-1"
          />
          <button type="submit" className="border border-yellow-800/40 hover:border-yellow-600/50 text-yellow-100/40 hover:text-yellow-400 font-bold uppercase tracking-wider px-4 py-2 cursor-pointer">
            Search
          </button>
        </div>
      </form>

      {projects.length > 0 ? (
        <>
          {projects.map((project) => (
            <div key={project.id} className="border border-yellow-800/20 bg-yellow-950/10 p-5 mb-4 hover:border-yellow-700/40 transition-all group relative">
              <span className="absolute top-0 left-0 w-2 h-2 border-t border-l border-yellow-700/30 group-hover:border-yellow-600/50 transition-colors" />
              <span className="absolute top-0 right-0 w-2 h-2 border-t border-r border-yellow-700/30 group-hover:border-yellow-600/50 transition-colors" />
              <span className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-yellow-700/30 group-hover:border-yellow-600/50 transition-colors" />
              <span className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-yellow-700/30 group-hover:border-yellow-600/50 transition-colors" />

              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-yellow-100/90 tracking-tight">
                  <Link href={`/projects/${project.id}`} className="text-yellow-500/60 hover:text-yellow-400">
                    {project.name}
                  </Link>
                </h2>
                {project.is_unlisted && <span className="text-[10px] uppercase tracking-wider text-yellow-600/50 border border-yellow-800/20 px-2 py-0.5">Unlisted</span>}
              </div>

              {project.description && <p className="text-yellow-100/30 mt-2">{project.description}</p>}

              {project.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {project.tags.map((tag) => (
                    <span key={tag} className="text-[10px] uppercase tracking-wider text-yellow-600/50 border border-yellow-800/20 px-2 py-0.5">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex gap-4 mt-3 text-sm text-yellow-100/30">
                <span>by {project.user_display_name}</span>
                <span>{project.ships_count} ships</span>
              </div>
            </div>
          ))}

          <Pagination pagy={pagy} />
        </>
      ) : (
        <p className="text-yellow-100/30">No projects yet.</p>
      )}
    </div>
  )
}
