import { useState } from 'react'
import { router } from '@inertiajs/react'
import { Download, Trash2, Search, MailQuestion } from 'lucide-react'
import { Button } from '@/components/admin/ui/button'
import { Card, CardContent } from '@/components/admin/ui/card'
import { Input } from '@/components/admin/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/admin/ui/table'
import AdminPagination from '@/components/admin/AdminPagination'
import type { PagyProps } from '@/types'

interface RsvpRow {
  id: number
  email: string
  created_at: string
}

export default function AdminRsvpsIndex({
  rsvps,
  pagy,
  query,
  total,
}: {
  rsvps: RsvpRow[]
  pagy: PagyProps
  query: string
  total: number
}) {
  const [searchQuery, setSearchQuery] = useState(query)

  function search(e: React.FormEvent) {
    e.preventDefault()
    router.get('/admin/rsvps', { query: searchQuery }, { preserveState: true })
  }

  function remove(id: number, email: string) {
    if (!confirm(`Remove ${email} from the RSVP list?`)) return
    router.delete(`/admin/rsvps/${id}`)
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">RSVPs</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {total} email{total === 1 ? '' : 's'} on the waitlist
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <form onSubmit={search} className="flex gap-2">
            <div className="relative">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by email"
                className="pl-9 w-64"
              />
            </div>
            <Button type="submit" variant="outline" size="sm">
              Search
            </Button>
          </form>
          <Button asChild size="sm">
            <a href="/admin/rsvps/export">
              <Download className="size-4" />
              Export CSV
            </a>
          </Button>
        </div>
      </div>

      {rsvps.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center space-y-2">
            <MailQuestion className="size-12 text-muted-foreground mx-auto" />
            <p className="text-base font-medium">{query ? 'No matches' : 'No RSVPs yet'}</p>
            <p className="text-sm text-muted-foreground">
              {query ? 'Try a different search.' : 'Emails will appear here as people sign up on the landing page.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rsvps.map((rsvp) => (
                  <TableRow key={rsvp.id}>
                    <TableCell className="font-mono text-sm">{rsvp.email}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{rsvp.created_at}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => remove(rsvp.id, rsvp.email)}>
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {pagy && pagy.pages > 1 && <AdminPagination pagy={pagy} />}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
