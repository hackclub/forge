import { useState } from 'react'
import { router, Link } from '@inertiajs/react'
import Pagination from '@/components/Pagination'
import type { AdminProjectRow, PagyProps } from '@/types'

export default function AdminProjectsIndex({
  projects,
  pagy,
  query,
}: {
  projects: AdminProjectRow[]
  pagy: PagyProps
  query: string
}) {
  const [searchQuery, setSearchQuery] = useState(query)

  function search(e: React.FormEvent) {
    e.preventDefault()
    router.get('/admin/projects', { query: searchQuery }, { preserveState: true })
  }

  return (
    <div className="max-w-6xl mx-auto py-8">
      <h1 className="font-bold text-4xl mb-6">Admin: Projects</h1>

      <form onSubmit={search} className="mb-6">
        <div className="flex gap-2">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects..."
            className="border rounded px-3 py-2 flex-1"
          />
          <button type="submit" className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300 cursor-pointer">
            Search
          </button>
        </div>
      </form>

      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b text-left">
            <th className="py-2 px-3">Name</th>
            <th className="py-2 px-3">Owner</th>
            <th className="py-2 px-3">Ships</th>
            <th className="py-2 px-3">Unlisted</th>
            <th className="py-2 px-3">Created</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((project) => (
            <tr key={project.id} className={`border-b hover:bg-gray-50 ${project.is_discarded ? 'opacity-50' : ''}`}>
              <td className="py-2 px-3">
                <Link href={`/admin/projects/${project.id}`} className="text-blue-600 hover:underline">
                  {project.name}
                </Link>
                {project.is_discarded && <span className="text-xs text-red-500 ml-1">Deleted</span>}
              </td>
              <td className="py-2 px-3">
                <Link href={`/admin/users/${project.user_id}`} className="text-blue-600 hover:underline">
                  {project.user_display_name}
                </Link>
              </td>
              <td className="py-2 px-3">{project.ships_count}</td>
              <td className="py-2 px-3">{project.is_unlisted ? 'Yes' : 'No'}</td>
              <td className="py-2 px-3">{project.created_at}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <Pagination pagy={pagy} />
    </div>
  )
}
