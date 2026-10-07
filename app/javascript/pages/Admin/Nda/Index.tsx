import { Link, router } from '@inertiajs/react'
import { RefreshCw, FileSignature } from 'lucide-react'
import { Badge } from '@/components/admin/ui/badge'
import { Button } from '@/components/admin/ui/button'
import { Card, CardContent } from '@/components/admin/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/admin/ui/table'

interface NdaUser {
  id: number
  display_name: string
  email: string
  avatar: string
  slack_id: string | null
  roles: string[]
  status: 'signed' | 'not_signed' | 'unknown' | 'no_slack_id'
  nda_version: string | null
  signed_at: string | null
}

function StatusBadge({ status }: { status: NdaUser['status'] }) {
  if (status === 'signed') return <Badge variant="success">Signed</Badge>
  if (status === 'not_signed') return <Badge variant="destructive">Not signed</Badge>
  if (status === 'no_slack_id') return <Badge variant="warning">No Slack ID</Badge>
  return <Badge variant="warning">Unknown</Badge>
}

export default function AdminNdaIndex({
  users,
  total,
  signed_count,
  not_signed_count,
  nda_version,
}: {
  users: NdaUser[]
  total: number
  signed_count: number
  not_signed_count: number
  nda_version: string | null
}) {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <FileSignature className="size-5" />
            NDA
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Whether staff with an elevated role have signed the current{' '}
            <a href="https://nda.hackclub.com/" target="_blank" rel="noreferrer" className="underline">
              Hack Club NDA
            </a>
            {nda_version ? ` (version ${nda_version})` : ''}.
          </p>
        </div>
        <Button variant="outline" onClick={() => router.post('/admin/nda/refresh')}>
          <RefreshCw className="size-4" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Elevated users</p>
            <p className="text-2xl font-semibold mt-1">{total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Signed</p>
            <p className="text-2xl font-semibold mt-1">{signed_count}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Not signed</p>
            <p className="text-2xl font-semibold mt-1">{not_signed_count}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          {users.length === 0 ? (
            <p className="text-sm text-muted-foreground py-10 text-center">No users with an elevated role.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Slack ID</TableHead>
                  <TableHead>NDA</TableHead>
                  <TableHead>Signed At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">
                      <Link href={`/admin/users/${u.id}`} className="hover:underline">
                        {u.display_name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm capitalize">{u.roles.join(', ')}</TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs">{u.slack_id || '—'}</TableCell>
                    <TableCell>
                      <StatusBadge status={u.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {u.signed_at ? new Date(u.signed_at).toLocaleString() : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
