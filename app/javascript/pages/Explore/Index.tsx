import { useState } from 'react'
import { Head, Link, router } from '@inertiajs/react'
import Pagination from '@/components/Pagination'
import type { PagyProps } from '@/types'

interface ExploreProject {
  id: number
  name: string
  subtitle: string | null
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
      <Head title="Explore — Forge" />
      <div className="p-12 max-w-[1400px] mx-auto">
        <section className="mb-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div className="max-w-2xl">
              <h1 className="text-5xl font-headline font-medium tracking-tight mb-4">
                Forge <span className="text-[#ffb595]">Dashboard</span>
              </h1>
              <p className="text-stone-400 text-lg leading-relaxed">
                Discover other Hackclubbers working on hardware projects!
              </p>
            </div>
            <form onSubmit={search} className="flex gap-2 w-full md:w-auto">
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects..."
                className="bg-[#0e0e0e] border-none rounded-lg px-4 py-2 text-sm text-[#e5e2e1] focus:ring-1 focus:ring-[#ee671c]/30 placeholder:text-stone-600 w-full md:w-64"
              />
              <button
                type="submit"
                className="bg-[#2a2a2a] text-[#e5e2e1] px-6 py-2 rounded-lg text-sm font-medium hover:bg-[#3a3939] transition-colors border border-white/5"
              >
                Search
              </button>
            </form>
          </div>
        </section>

        {projects.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="group bg-[#1c1b1b] p-1 rounded-xl transition-all duration-300 hover:bg-[#2a2a2a] ghost-border"
                >
                  <div className="aspect-[16/10] overflow-hidden rounded-lg mb-4 bg-[#0e0e0e] flex items-center justify-center">
                    <span className="material-symbols-outlined text-6xl text-stone-800 group-hover:text-stone-700 transition-colors">precision_manufacturing</span>
                  </div>

                  <div className="px-5 pb-5">
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-xs uppercase tracking-widest text-stone-500 bg-[#353534] px-3 py-1 rounded-full">
                        Project
                      </span>
                      <span className="text-stone-500 text-xs">{project.ships_count} ships</span>
                    </div>

                    <h3 className="text-xl font-headline font-medium mb-2 group-hover:text-[#ffb595] transition-colors">
                      {project.name}
                    </h3>

                    {project.subtitle && (
                      <p className="text-stone-500 text-sm mb-4 line-clamp-2">{project.subtitle}</p>
                    )}

                    <div className="flex justify-between items-center pt-2">
                      <div className="flex items-center gap-2">
                        <img
                          src={project.user_avatar}
                          alt={project.user_display_name}
                          className="w-6 h-6 rounded-full border border-white/10"
                        />
                        <span className="text-xs text-stone-400">{project.user_display_name}</span>
                      </div>
                      <span className="material-symbols-outlined text-lg text-stone-400 group-hover:text-[#ffb595] transition-colors">arrow_forward</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <Pagination pagy={pagy} />
          </>
        ) : (
          <div className="bg-[#1c1b1b] rounded-xl ghost-border p-16 text-center">
            <span className="material-symbols-outlined text-5xl text-stone-700 mb-4">search_off</span>
            <p className="text-stone-300 text-lg font-headline font-medium mb-2">
              {query ? 'No projects found' : 'No projects yet'}
            </p>
            <p className="text-stone-500 text-sm">
              {query ? 'Try a different search term.' : 'Be the first to submit a project.'}
            </p>
          </div>
        )}
      </div>
    </>
  )
}
