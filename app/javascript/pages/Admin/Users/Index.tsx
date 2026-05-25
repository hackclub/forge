import { useState } from 'react'
import { router, Link } from '@inertiajs/react'
import { Search } from 'lucide-react'
import { Badge } from '@/components/admin/ui/badge'
import { Button } from '@/components/admin/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/admin/ui/card'
import { Input } from '@/components/admin/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/admin/ui/table'
import AdminPagination from '@/components/admin/AdminPagination'
import { cn } from '@/components/admin/lib/cn'
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
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
        <form onSubmit={search} className="flex gap-2 items-center">
          <div className="relative">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, or Slack ID…"
              className="pl-9 w-80"
            />
          </div>
          <Button type="submit" variant="outline" size="sm">
            Search
          </Button>
        </form>
      </div>

      <div className="flex gap-2 flex-wrap">
        {available_roles.map((role) => (
          <button
            key={role}
            onClick={() => filterByRole(role)}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded-md border transition-colors cursor-pointer capitalize',
              role === role_filter
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground',
            )}
          >
            {role}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {users.length} user{users.length === 1 ? '' : 's'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {users.length === 0 ? (
            <p className="text-sm text-muted-foreground py-10 text-center">No users match.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Projects</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow
                    key={user.id}
                    className={cn('cursor-pointer', user.is_discarded && 'opacity-50')}
                    onClick={() => router.visit(`/admin/users/${user.id}`)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Link href={`/admin/users/${user.id}`} className="hover:underline" onClick={(e) => e.stopPropagation()}>
                          {user.display_name}
                        </Link>
                        {user.is_banned && <Badge variant="destructive">Banned</Badge>}
                        {user.is_discarded && <Badge variant="outline">Deleted</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm truncate max-w-xs">{user.email}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{user.roles.join(', ') || '—'}</TableCell>
                    <TableCell className="font-mono text-sm">{user.projects_count}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{user.created_at}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {pagy && pagy.pages > 1 && <AdminPagination pagy={pagy} />}
        </CardContent>
      </Card>
    </div>
  )
}
