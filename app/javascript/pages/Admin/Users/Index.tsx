import { useState } from 'react'
import { router, Link } from '@inertiajs/react'
import Pagination from '@/components/Pagination'
import type { AdminUserRow, PagyProps } from '@/types'

export default function AdminUsersIndex({
  users,
  pagy,
  query,
}: {
  users: AdminUserRow[]
  pagy: PagyProps
  query: string
}) {
  const [searchQuery, setSearchQuery] = useState(query)

  function search(e: React.FormEvent) {
    e.preventDefault()
    router.get('/admin/users', { query: searchQuery }, { preserveState: true })
  }

  return (
    <div className="max-w-6xl mx-auto py-8">
      <h1 className="font-bold text-4xl mb-6">Admin: Users</h1>

      <form onSubmit={search} className="mb-6">
        <div className="flex gap-2">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users..."
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
            <th className="py-2 px-3">Email</th>
            <th className="py-2 px-3">Roles</th>
            <th className="py-2 px-3">Projects</th>
            <th className="py-2 px-3">Joined</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className={`border-b hover:bg-gray-50 ${user.is_discarded ? 'opacity-50' : ''}`}>
              <td className="py-2 px-3">
                <Link href={`/admin/users/${user.id}`} className="text-blue-600 hover:underline">
                  {user.display_name}
                </Link>
                {user.is_discarded && <span className="text-xs text-red-500 ml-1">Deleted</span>}
              </td>
              <td className="py-2 px-3">{user.email}</td>
              <td className="py-2 px-3">{user.roles.join(', ')}</td>
              <td className="py-2 px-3">{user.projects_count}</td>
              <td className="py-2 px-3">{user.created_at}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <Pagination pagy={pagy} />
    </div>
  )
}
