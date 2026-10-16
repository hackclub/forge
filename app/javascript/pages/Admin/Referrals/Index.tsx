import { router } from '@inertiajs/react'
import { Badge } from '@/components/admin/ui/badge'
import { Card, CardContent } from '@/components/admin/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/admin/ui/table'
import { cn } from '@/components/admin/lib/cn'

interface ReferralUserRow {
  id: number
  display_name: string
  avatar: string
  referral_code: string
  total: number
  eligible_count: number
  approved_count: number
  pins_count: number
}

interface Stats {
  total_unique_referrals: number
  approved_count: number
  eligible_count: number
  pending_count: number
  pins_earned: number
  pins_shipped: number
}

function StatCard({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <Card className={cn(accent && 'border-primary/40')}>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
        <p className={cn('text-2xl font-semibold', accent && 'text-primary')}>{value}</p>
      </CardContent>
    </Card>
  )
}

export default function AdminReferralsIndex({
  users,
  stats,
  pin_threshold,
}: {
  users: ReferralUserRow[]
  stats: Stats
  pin_threshold: number
}) {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Referrals</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Every {pin_threshold} approved referrals creates a Forge pin order for the referrer, which is shipped through
          the orders queue.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Referrals" value={stats.total_unique_referrals} />
        <StatCard label="Approved" value={stats.approved_count} />
        <StatCard label="Eligible" value={stats.eligible_count} />
        <StatCard label="Pending Ship" value={stats.pending_count} />
        <StatCard label="Pins Earned" value={stats.pins_earned} accent />
        <StatCard label="Pins Shipped" value={stats.pins_shipped} />
      </div>

      <Card>
        <CardContent className="pt-6">
          {users.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-base font-medium mb-1">No referrals yet</p>
              <p className="text-sm text-muted-foreground">
                Users get credit once their referred builder ships a project.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Referrer</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Eligible</TableHead>
                  <TableHead>Approved</TableHead>
                  <TableHead>Pins</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow
                    key={user.id}
                    onClick={() => router.visit(`/admin/referrals/${user.id}`)}
                    className="cursor-pointer"
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <img src={user.avatar} alt="" className="size-6 rounded-full" />
                        <span className="font-medium">{user.display_name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{user.referral_code}</TableCell>
                    <TableCell>{user.total}</TableCell>
                    <TableCell>
                      <Badge variant="warning">{user.eligible_count}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="success">{user.approved_count}</Badge>
                    </TableCell>
                    <TableCell>{user.pins_count}</TableCell>
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
