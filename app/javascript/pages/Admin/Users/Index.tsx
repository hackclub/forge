import { useState } from 'react'
import { router, Link } from '@inertiajs/react'
import Pagination from '@/components/Pagination'
import type { AdminUserRow, PagyProps } from '@/types'

export default function AdminUsersIndex({
  users,
  pagy,
  query,
  role_filter,
  available_roles,
}: {
  users: AdminUserRow[]
  pagy: PagyProps
  query: string
  role_filter: string
  available_roles: string[]
}) {
  const [searchQuery, setSearchQuery] = useState(query)

  function search(e: React.FormEvent) {
    e.preventDefault()
    router.get('/admin/users', { query: searchQuery, role: role_filter || undefined }, { preserveState: true })
  }

  function filterByRole(role: string) {
    const newRole = role === role_filter ? undefined : role
    router.get('/admin/users', { query: searchQuery || undefined, role: newRole }, { preserveState: true })
  }

  return (
    <div className="p-12 max-w-[1400px] mx-auto">
      <h1 className="text-4xl font-headline font-bold text-[#e5e2e1] tracking-tight mb-8">Users</h1>

      <form onSubmit={search} className="mb-4">
        <div className="flex gap-2">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users..."
            className="bg-[#0e0e0e] border-none px-4 py-2 text-sm text-[#e5e2e1] focus:ring-1 focus:ring-[#ee671c]/30 placeholder:text-stone-600 flex-1"
          />
          <button type="submit" className="bg-[#2a2a2a] text-[#e5e2e1] px-4 py-2 text-sm font-medium hover:bg-[#3a3939] transition-colors ghost-border cursor-pointer">
            Search
          </button>
        </div>
      </form>

      <div className="flex gap-2 flex-wrap mb-8">
        {available_roles.map((role) => (
          <button
            key={role}
            onClick={() => filterByRole(role)}
            className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] transition-colors cursor-pointer ${
              role === role_filter
                ? 'signature-smolder text-[#4c1a00]'
                : 'ghost-border bg-[#1c1b1b] text-stone-500 hover:text-stone-300 hover:bg-[#2a2a2a]'
            }`}
          >
            {role}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        <div className="grid grid-cols-[1fr_1fr_auto_auto_auto] gap-4 px-5 py-3 text-[10px] uppercase tracking-[0.2em] font-bold text-stone-600">
          <span>Name</span>
          <span>Email</span>
          <span>Roles</span>
          <span>Projects</span>
          <span>Joined</span>
        </div>
        {users.map((user) => (
          <Link
            key={user.id}
            href={`/admin/users/${user.id}`}
            className={`grid grid-cols-[1fr_1fr_auto_auto_auto] gap-4 bg-[#1c1b1b] px-5 py-4 ghost-border hover:bg-[#2a2a2a] transition-all group ${user.is_discarded ? 'opacity-50' : ''}`}
          >
            <span className="font-headline font-bold text-[#e5e2e1] group-hover:text-[#ffb595] transition-colors truncate flex items-center gap-2">
              {user.display_name}
              {user.is_banned && <span className="bg-red-500/20 text-red-400 px-2 py-0.5 text-[9px] uppercase font-bold tracking-widest shrink-0">Banned</span>}
              {user.is_discarded && <span className="text-red-400 text-xs font-normal">Deleted</span>}
            </span>
            <span className="text-stone-400 text-sm truncate">{user.email}</span>
            <span className="text-stone-500 text-xs">{user.roles.join(', ')}</span>
            <span className="text-stone-500 text-xs">{user.projects_count}</span>
            <span className="text-stone-500 text-xs">{user.created_at}</span>
          </Link>
        ))}
      </div>

      <Pagination pagy={pagy} />
    </div>
  )
}
