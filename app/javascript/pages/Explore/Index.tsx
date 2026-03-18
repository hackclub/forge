import { useState } from 'react'
import { Head, Link, router } from '@inertiajs/react'
import Pagination from '@/components/Pagination'
import type { PagyProps } from '@/types'

interface ExploreProject {
  id: number
  name: string
  description: string | null
  tags: string[]
  user_display_name: string
  user_avatar: string
  ships_count: number
  created_at: string
}

export default function ExploreIndex({
  projects,
  pagy,
  query,
}: {
  projects: ExploreProject[]
  pagy: PagyProps
  query: string
}) {
  const [searchQuery, setSearchQuery] = useState(query)

  function search(e: React.FormEvent) {
    e.preventDefault()
    router.get('/explore', { query: searchQuery }, { preserveState: true })
  }

  return (
    <>
      <Head title="Explore — Quarry" />
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-10">
          <p className="text-yellow-700/60 text-[10px] uppercase tracking-[0.4em] font-bold mb-2">The Quarry</p>
          <h1 className="text-3xl font-black text-yellow-100/90 tracking-tight mb-2">Explore Projects</h1>
          <p className="text-yellow-100/25 text-sm">See what builders are working on.</p>
        </div>

        <form onSubmit={search} className="mb-8">
          <div className="flex gap-3">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects..."
              className="flex-1 bg-yellow-950/20 border border-yellow-800/30 text-yellow-100/80 placeholder-yellow-100/15 focus:border-yellow-600/50 focus:outline-none px-4 py-2.5 text-sm"
            />
            <button
              type="submit"
              className="border border-yellow-800/40 hover:border-yellow-600/50 text-yellow-100/40 hover:text-yellow-400 font-bold px-6 py-2.5 text-sm uppercase tracking-wider transition-all"
            >
              Search
            </button>
          </div>
        </form>

        {projects.length > 0 ? (
          <>
            <div className="grid sm:grid-cols-2 gap-4">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="block border border-yellow-800/20 bg-yellow-950/10 p-6 hover:border-yellow-700/40 transition-all group relative"
                >
                  <span className="absolute top-0 left-0 w-2 h-2 border-t border-l border-yellow-700/30 group-hover:border-yellow-600/50 transition-colors" />
                  <span className="absolute top-0 right-0 w-2 h-2 border-t border-r border-yellow-700/30 group-hover:border-yellow-600/50 transition-colors" />
                  <span className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-yellow-700/30 group-hover:border-yellow-600/50 transition-colors" />
                  <span className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-yellow-700/30 group-hover:border-yellow-600/50 transition-colors" />

                  <div className="flex items-start gap-3 mb-3">
                    <img
                      src={project.user_avatar}
                      alt={project.user_display_name}
                      className="w-8 h-8 border border-yellow-800/30 shrink-0 mt-0.5"
                    />
                    <div className="min-w-0">
                      <h2 className="font-black text-yellow-100/80 group-hover:text-yellow-100/95 transition-colors truncate">{project.name}</h2>
                      <p className="text-yellow-100/25 text-xs">by {project.user_display_name}</p>
                    </div>
                  </div>

                  {project.description && (
                    <p className="text-yellow-100/20 text-sm leading-relaxed line-clamp-2 mb-3">{project.description}</p>
                  )}

                  {project.tags.length > 0 && (
                    <div className="flex gap-2 flex-wrap mb-3">
                      {project.tags.map((tag) => (
                        <span key={tag} className="text-[10px] uppercase tracking-wider text-yellow-600/50 border border-yellow-800/20 px-2 py-0.5">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-yellow-100/15">
                    <span>{project.ships_count} ships</span>
                    <span>{project.created_at}</span>
                  </div>
                </Link>
              ))}
            </div>

            <Pagination pagy={pagy} />
          </>
        ) : (
          <div className="border border-yellow-800/20 bg-yellow-950/10 p-12 text-center">
            <p className="text-yellow-100/30 text-lg font-bold mb-2">
              {query ? 'No projects found' : 'No projects yet'}
            </p>
            <p className="text-yellow-100/15 text-sm">
              {query ? 'Try a different search term.' : 'Be the first to stake a claim.'}
            </p>
          </div>
        )}
      </div>
    </>
  )
}
