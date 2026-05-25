import { Link, router } from '@inertiajs/react'
import { RefreshCw, ShieldX, AlertTriangle, Gavel } from 'lucide-react'
import { Badge } from '@/components/admin/ui/badge'
import { Button } from '@/components/admin/ui/button'
import { Card, CardContent } from '@/components/admin/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/admin/ui/table'

interface FlaggedUser {
  id: number
  display_name: string
  email: string
  avatar: string
  slack_id: string
  is_banned: boolean
  hackatime_banned_at: string | null
}

export default function AdminHackatimeBansIndex({
  users,
  enabled,
  total_flagged,
  pending_ban_count,
}: {
  users: FlaggedUser[]
  enabled: boolean
  total_flagged: number
  pending_ban_count: number
}) {
  function refresh() {
    router.post('/admin/hackatime_bans/refresh')
  }

  function banAll() {
    if (pending_ban_count === 0) return
    if (!confirm(`Ban ${pending_ban_count} user${pending_ban_count === 1 ? '' : 's'} from Forge? This cannot be undone in bulk.`)) return
    router.post('/admin/hackatime_bans/ban_all')
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <ShieldX className="size-5" />
            Hackatime Bans
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Users flagged as banned on Hackatime. Run a refresh to re-scan, then sync to ban the flagged users on Forge.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={refresh} disabled={!enabled}>
            <RefreshCw className="size-4" />
            Refresh check
          </Button>
          <Button variant="destructive" onClick={banAll} disabled={pending_ban_count === 0}>
            <Gavel className="size-4" />
            Sync ({pending_ban_count} to ban)
          </Button>
        </div>
      </div>

      {!enabled && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="p-3 text-sm text-destructive flex items-start gap-2">
            <AlertTriangle className="size-4 shrink-0 mt-0.5" />
            <span>Hackatime is not configured. Set <code>HACKATIME_ADMIN_API_KEY</code> to enable checks.</span>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Flagged on Hackatime</p>
            <p className="text-2xl font-semibold mt-1">{total_flagged}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Not yet banned on Forge</p>
            <p className="text-2xl font-semibold mt-1">{pending_ban_count}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          {users.length === 0 ? (
            <p className="text-sm text-muted-foreground py-10 text-center">
              No users flagged on Hackatime. Run a refresh to scan.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Slack ID</TableHead>
                  <TableHead>Flagged At</TableHead>
                  <TableHead>Forge Status</TableHead>
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
                    <TableCell className="text-muted-foreground text-sm truncate max-w-xs">{u.email}</TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs">{u.slack_id || '—'}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{u.hackatime_banned_at || '—'}</TableCell>
                    <TableCell>
                      {u.is_banned ? (
                        <Badge variant="destructive">Banned</Badge>
                      ) : (
                        <Badge variant="warning">Pending</Badge>
                      )}
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
