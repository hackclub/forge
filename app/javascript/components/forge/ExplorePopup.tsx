import { useEffect, useRef, useState } from 'react'
import { Link, router, usePage } from '@inertiajs/react'
import type { PagyProps, SharedProps } from '@/types'
import { ForgeLoading } from './useForgeData'

interface ExploreProject {
  id: number
  name: string
  subtitle: string | null
  cover_image_url: string | null
  user_id: number
  user_display_name: string
  user_avatar: string
  ships_count: number
  views_count: number
  built: boolean
  created_at: string
}

type Filter = 'all' | 'in_progress' | 'built'

interface ExploreData {
  projects: ExploreProject[]
  pagy: PagyProps
  query: string
  filter: Filter
}

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'built', label: 'Built' },
]

export default function ExplorePopup() {
  const page = usePage<SharedProps>().props
  const live = page.explore as ExploreData | undefined
  const reelsEnabled = page.reels_enabled
  const [cached, setCached] = useState<ExploreData | null>(live ?? null)
  const [searchInput, setSearchInput] = useState('')
  const requested = useRef(false)

  useEffect(() => {
    if (live === undefined && !requested.current) {
      requested.current = true
      router.reload({ only: ['explore'] })
    }
  }, [live])

  useEffect(() => {
    if (live !== undefined) {
      setCached(live)
      setSearchInput(live.query)
    }
  }, [live])

  if (!cached) return <ForgeLoading />
  const data = cached

  function load(params: { query: string; filter: string; page: number }) {
    router.reload({ only: ['explore'], data: params })
  }

  function search(e: React.FormEvent) {
    e.preventDefault()
    load({ query: searchInput, filter: data.filter, page: 1 })
  }

  const pages: (number | '...')[] = []
  for (let i = 1; i <= data.pagy.pages; i++) {
    if (i === 1 || i === data.pagy.pages || (i >= data.pagy.page - 1 && i <= data.pagy.page + 1)) {
      pages.push(i)
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <p className="text-sm text-stone-400">Discover what other forgers are working on.</p>
          {reelsEnabled && (
            <Link
              href="/reels"
              className="inline-flex shrink-0 items-center gap-1.5 bg-[#1c1b1b] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-stone-400 ghost-border transition-colors hover:text-[#ffb595]"
            >
              <span className="material-symbols-outlined text-sm">play_circle</span>
              Reels
            </Link>
          )}
        </div>
        <form onSubmit={search} className="flex w-full gap-2 sm:w-auto">
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search projects..."
            className="w-full bg-[#0e0e0e] px-4 py-2 text-sm text-[#e5e2e1] ghost-border placeholder:text-stone-600 focus:outline-none focus:ring-1 focus:ring-[#ca5924]/30 sm:w-64"
          />
          <button
            type="submit"
            className="shrink-0 bg-[#2a2a2a] px-5 py-2 text-sm font-medium text-[#e5e2e1] ghost-border transition-colors hover:bg-[#3a3939]"
          >
            Search
          </button>
        </form>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const active = data.filter === f.key
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => load({ query: data.query, filter: f.key, page: 1 })}
              className={
                active
                  ? 'signature-smolder cursor-pointer px-4 py-1.5 text-xs font-bold uppercase tracking-[0.15em] text-[#4c1a00]'
                  : 'cursor-pointer bg-[#1c1b1b] px-4 py-1.5 text-xs font-bold uppercase tracking-[0.15em] text-stone-400 ghost-border transition-colors hover:bg-[#2a2a2a] hover:text-[#e5e2e1]'
              }
            >
              {f.label}
            </button>
          )
        })}
      </div>

      {data.projects.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {data.projects.map((project) => (
              <div
                key={project.id}
                className="group flex flex-col bg-[#1c1b1b] p-1 ghost-border transition-colors hover:bg-[#2a2a2a]"
              >
                <Link href={`/projects/${project.id}`} className="block">
                  <div className="mb-3 flex aspect-[16/10] items-center justify-center overflow-hidden bg-[#0e0e0e]">
                    {project.cover_image_url ? (
                      <img src={project.cover_image_url} alt={project.name} className="h-full w-full object-cover" />
                    ) : (
                      <img
                        src="/orph-building.png"
                        alt={project.name}
                        className="max-h-[90%] max-w-[90%] object-contain"
                      />
                    )}
                  </div>
                  <div className="px-4">
                    <div className="mb-2 flex items-center justify-between">
                      <span
                        className={
                          project.built
                            ? 'bg-emerald-900/40 px-2.5 py-0.5 text-[10px] uppercase tracking-widest text-emerald-300'
                            : 'bg-[#353534] px-2.5 py-0.5 text-[10px] uppercase tracking-widest text-stone-500'
                        }
                      >
                        {project.built ? 'Built' : 'In Progress'}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-stone-500" title="Views">
                        <span className="material-symbols-outlined text-sm leading-none">visibility</span>
                        {project.views_count.toLocaleString()}
                      </span>
                    </div>
                    <h3 className="mb-1 break-words font-headline text-lg font-medium transition-colors group-hover:text-[#ffb595]">
                      {project.name}
                    </h3>
                    {project.subtitle && (
                      <p className="mb-3 line-clamp-2 break-words text-sm text-stone-500">{project.subtitle}</p>
                    )}
                  </div>
                </Link>
                <Link
                  href={`/users/${project.user_id}`}
                  className="mt-auto flex items-center gap-2 px-4 pb-4 pt-1 text-stone-400 transition-colors hover:text-[#ffb595]"
                >
                  <img
                    src={project.user_avatar}
                    alt={project.user_display_name}
                    className="h-6 w-6 rounded-full border border-white/10"
                  />
                  <span className="text-xs">{project.user_display_name}</span>
                </Link>
              </div>
            ))}
          </div>

          {data.pagy.pages > 1 && (
            <nav className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => data.pagy.prev && load({ query: data.query, filter: data.filter, page: data.pagy.prev })}
                disabled={!data.pagy.prev}
                className="flex h-9 w-9 items-center justify-center bg-[#2a2a2a] text-stone-400 ghost-border transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
              >
                <span className="material-symbols-outlined text-sm">chevron_left</span>
              </button>
              {pages.map((p, i) =>
                p === '...' ? (
                  <span key={`dots-${i}`} className="px-1 text-stone-600">
                    ...
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => load({ query: data.query, filter: data.filter, page: p })}
                    className={`h-9 w-9 font-headline font-bold transition-colors ${
                      p === data.pagy.page
                        ? 'signature-smolder text-[#4c1a00]'
                        : 'bg-[#2a2a2a] text-stone-400 ghost-border hover:text-white'
                    }`}
                  >
                    {p}
                  </button>
                ),
              )}
              <button
                onClick={() => data.pagy.next && load({ query: data.query, filter: data.filter, page: data.pagy.next })}
                disabled={!data.pagy.next}
                className="flex h-9 w-9 items-center justify-center bg-[#2a2a2a] text-stone-400 ghost-border transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
              >
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
            </nav>
          )}
        </>
      ) : (
        <div className="bg-[#1c1b1b] p-16 text-center ghost-border">
          <span className="material-symbols-outlined mb-4 text-5xl text-stone-700">search_off</span>
          <p className="mb-2 font-headline text-lg font-medium text-stone-300">
            {data.query
              ? 'No projects found'
              : data.filter === 'built'
                ? 'No built projects yet'
                : data.filter === 'in_progress'
                  ? 'No projects in progress'
                  : 'No projects yet'}
          </p>
          <p className="text-sm text-stone-500">
            {data.query ? 'Try a different search term or clear the filter.' : 'Be the first to submit a project.'}
          </p>
        </div>
      )}
    </div>
  )
}
