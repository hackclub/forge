import { useState } from 'react'
import { router, Link } from '@inertiajs/react'
import Pagination from '@/components/Pagination'
import type { AdminProjectRow, PagyProps, ProjectStatus } from '@/types'

const statusConfig: Record<ProjectStatus, { label: string; text: string }> = {
  draft: { label: 'Draft', text: 'text-stone-400' },
  pending: { label: 'Pending', text: 'text-amber-400' },
  approved: { label: 'Approved', text: 'text-emerald-400' },
  returned: { label: 'Returned', text: 'text-orange-400' },
  rejected: { label: 'Rejected', text: 'text-red-400' },
  build_pending: { label: 'Build Review', text: 'text-amber-400' },
  build_approved: { label: 'Build Approved', text: 'text-emerald-400' },
}

const filters = [
  { key: '', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'build_pending', label: 'Build Review' },
  { key: 'build_approved', label: 'Build Approved' },
  { key: 'returned', label: 'Returned' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'draft', label: 'Draft' },
]

export default function AdminProjectsIndex({
  projects,
  pagy,
  query,
  status_filter,
  counts,
}: {
  projects: AdminProjectRow[]
  pagy: PagyProps
  query: string
  status_filter: string
  counts: Record<string, number>
}) {
  const [searchQuery, setSearchQuery] = useState(query)

  function search(e: React.FormEvent) {
    e.preventDefault()
    router.get('/admin/projects', { query: searchQuery, status: status_filter }, { preserveState: true })
  }

  function filterByStatus(status: string) {
    router.get('/admin/projects', { query: searchQuery, status }, { preserveState: true })
  }

  return (
    <div className="p-12 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-headline font-bold text-[#e5e2e1] tracking-tight">All Projects</h1>
        <form onSubmit={search} className="flex gap-2">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by ID, title, or author"
            className="bg-[#0e0e0e] border-none px-4 py-2 text-sm text-[#e5e2e1] focus:ring-1 focus:ring-[#ee671c]/30 placeholder:text-stone-600 w-80"
          />
          <button type="submit" className="bg-[#2a2a2a] text-[#e5e2e1] px-4 py-2 text-sm font-medium hover:bg-[#3a3939] transition-colors ghost-border cursor-pointer">
            Search
          </button>
        </form>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {filters.map((f) => {
          const count = f.key ? counts[f.key] || 0 : counts.all || 0
          const isActive = status_filter === f.key
          return (
            <button
              key={f.key}
              onClick={() => filterByStatus(f.key)}
              className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer ${
                isActive
                  ? 'signature-smolder text-[#4c1a00] font-bold'
                  : 'bg-[#1c1b1b] text-stone-400 hover:bg-[#2a2a2a] ghost-border'
              }`}
            >
              {f.label}
              <span className={`text-xs ${isActive ? 'text-[#4c1a00]/70' : 'text-stone-600'}`}>{count}</span>
            </button>
          )
        })}
      </div>

      {projects.length > 0 ? (
        <>
          <div className="ghost-border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-5 py-3 text-[10px] uppercase tracking-[0.2em] font-bold text-stone-600">ID</th>
                  <th className="text-left px-5 py-3 text-[10px] uppercase tracking-[0.2em] font-bold text-stone-600">Title</th>
                  <th className="text-left px-5 py-3 text-[10px] uppercase tracking-[0.2em] font-bold text-stone-600">Author</th>
                  <th className="text-left px-5 py-3 text-[10px] uppercase tracking-[0.2em] font-bold text-stone-600">Status</th>
                  <th className="text-left px-5 py-3 text-[10px] uppercase tracking-[0.2em] font-bold text-stone-600">Ships</th>
                  <th className="text-left px-5 py-3 text-[10px] uppercase tracking-[0.2em] font-bold text-stone-600">Created</th>
                  <th className="text-right px-5 py-3 text-[10px] uppercase tracking-[0.2em] font-bold text-stone-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => {
                  const sc = statusConfig[project.status] || statusConfig.draft
                  return (
                    <tr key={project.id} className={`border-b border-white/5 hover:bg-[#1c1b1b] transition-colors ${project.is_discarded ? 'opacity-50' : ''}`}>
                      <td className="px-5 py-3 text-stone-500 text-sm">{project.id}</td>
                      <td className="px-5 py-3">
                        <span className="font-headline font-bold text-[#e5e2e1] text-sm">
                          {project.name}
                        </span>
                        {project.is_discarded && <span className="text-red-400 text-xs ml-2">Deleted</span>}
                      </td>
                      <td className="px-5 py-3">
                        <Link href={`/admin/users/${project.user_id}`} className="text-[#ffb595] hover:text-[#ee671c] transition-colors text-sm">
                          {project.user_display_name}
                        </Link>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`${sc.text} text-xs font-bold uppercase tracking-wider`}>{sc.label}</span>
                      </td>
                      <td className="px-5 py-3 text-stone-400 text-sm">{project.ships_count}</td>
                      <td className="px-5 py-3 text-stone-500 text-xs">{project.created_at}</td>
                      <td className="px-5 py-3 text-right">
                        <Link
                          href={`/admin/projects/${project.id}`}
                          className="ghost-border px-3 py-1.5 text-xs font-bold uppercase tracking-[0.15em] text-stone-400 hover:text-[#e5e2e1] hover:bg-[#2a2a2a] transition-colors"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <Pagination pagy={pagy} />
        </>
      ) : (
        <div className="bg-[#1c1b1b] ghost-border p-16 text-center">
          <p className="text-stone-300 text-lg font-headline font-medium mb-2">No projects found</p>
          <p className="text-stone-500 text-sm">
            {status_filter ? `No ${status_filter} projects.` : 'No projects yet.'}
          </p>
        </div>
      )}
    </div>
  )
}
