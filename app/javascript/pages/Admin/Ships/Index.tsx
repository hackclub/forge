import { Link } from '@inertiajs/react'
import { Hammer, Clock, ArrowRight } from 'lucide-react'
import { Badge } from '@/components/admin/ui/badge'
import { Button } from '@/components/admin/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/admin/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/admin/ui/table'
import AdminPagination from '@/components/admin/AdminPagination'
import type { AdminShipRow, PagyProps } from '@/types'

function statusBadge(status: AdminShipRow['status']) {
  switch (status) {
    case 'approved':
      return <Badge variant="success">Approved</Badge>
    case 'returned':
      return <Badge variant="warning">Returned</Badge>
    case 'rejected':
      return <Badge variant="destructive">Rejected</Badge>
    default:
      return <Badge variant="secondary">Pending</Badge>
  }
}

function formatHours(seconds: number | null): string {
  if (seconds == null) return '—'
  return `${(seconds / 3600).toFixed(1)}h`
}

export default function AdminShipsIndex({
  pending_ships,
  all_ships,
  pagy,
  first_pending_id,
}: {
  pending_ships: AdminShipRow[]
  all_ships: AdminShipRow[]
  pagy: PagyProps
  first_pending_id: number | null
}) {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Ship Reviews</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Verify journaled hours and quality before approving a hardware ship.
          </p>
        </div>
        {first_pending_id != null && (
          <Button asChild>
            <Link href={`/admin/ships/${first_pending_id}`}>
              <Hammer className="size-4" />
              Start Reviewing
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="size-4" />
            Pending
            {pending_ships.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {pending_ships.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pending_ships.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Queue is empty. Nice.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Builder</TableHead>
                  <TableHead>Hours Claimed</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="w-32"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pending_ships.map((ship) => (
                  <TableRow key={ship.id}>
                    <TableCell className="font-medium">{ship.project_name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <img src={ship.user_avatar} alt="" className="size-5 rounded-full" />
                        <span>{ship.user_display_name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{ship.claimed_hours.toFixed(1)}h</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{ship.created_at}</TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/admin/ships/${ship.id}`}>Review</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Ships</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {all_ships.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No ships yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Builder</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reviewer</TableHead>
                  <TableHead>Approved</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {all_ships.map((ship) => (
                  <TableRow key={ship.id}>
                    <TableCell className="font-medium">{ship.project_name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <img src={ship.user_avatar} alt="" className="size-5 rounded-full" />
                        <span>{ship.user_display_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{statusBadge(ship.status)}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{ship.reviewer_display_name || '—'}</TableCell>
                    <TableCell className="font-mono text-sm">{formatHours(ship.approved_seconds)}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{ship.created_at}</TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm" variant="ghost">
                        <Link href={`/admin/ships/${ship.id}`}>Open</Link>
                      </Button>
                    </TableCell>
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
