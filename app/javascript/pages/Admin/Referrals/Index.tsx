import { router, Link } from '@inertiajs/react'
import { Dices, RotateCcw, Zap, Trophy } from 'lucide-react'
import { Badge } from '@/components/admin/ui/badge'
import { Button } from '@/components/admin/ui/button'
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
}

interface Stats {
  total_unique_referrals: number
  approved_count: number
  eligible_count: number
  pending_count: number
  prize_pool: number
  total_paid_out_to_pool: number
  total_referral_spend: number
}

interface Winner {
  id: number
  display_name: string
  avatar: string
  tickets: number
  pool_amount: number
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
  winner,
}: {
  users: ReferralUserRow[]
  stats: Stats
  winner?: Winner | null
}) {
  function drawWinner() {
    if (!confirm('Draw a random winner from the approved referrers?')) return
    router.post('/admin/referrals/draw_winner')
  }

  function resetPool() {
    if (!confirm('Reset the prize pool to 0?')) return
    router.post('/admin/referrals/reset_pool')
  }

  function forceApproveAll() {
    if (!confirm('Pay out every non-approved referral, including pending ones? Cannot be undone.')) return
    router.post('/admin/referrals/force_approve_all')
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Referrals</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Referrals" value={stats.total_unique_referrals} />
        <StatCard label="Approved" value={stats.approved_count} />
        <StatCard label="Eligible" value={stats.eligible_count} />
        <StatCard label="Pending Ship" value={stats.pending_count} />
        <StatCard label="Prize Pool" value={`${stats.prize_pool.toFixed(2)}c`} accent />
        <StatCard label="Total Pool Paid" value={`${stats.total_paid_out_to_pool.toFixed(2)}c`} />
        <StatCard label="Total Spend" value={`${stats.total_referral_spend.toFixed(2)}c`} />
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button onClick={drawWinner}>
          <Dices className="size-4" />
          Draw Winner
        </Button>
        <Button variant="outline" onClick={resetPool}>
          <RotateCcw className="size-4" />
          Reset Pool
        </Button>
        <Button variant="destructive" onClick={forceApproveAll}>
          <Zap className="size-4" />
          Pay Out All
        </Button>
      </div>

      {winner && (
        <Card className="border-primary/40">
          <CardContent className="p-4 flex items-center gap-4">
            <Trophy className="size-8 text-primary shrink-0" />
            <img src={winner.avatar} alt="" className="size-12 rounded-full" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Winner Drawn</p>
              <Link
                href={`/admin/users/${winner.id}`}
                className="text-lg font-semibold hover:underline truncate block"
              >
                {winner.display_name}
              </Link>
              <p className="text-sm text-muted-foreground">
                Had {winner.tickets} ticket{winner.tickets === 1 ? '' : 's'} · Pool was {winner.pool_amount.toFixed(2)}c
              </p>
            </div>
            <p className="text-xs text-muted-foreground hidden md:block">Pay out manually, then reset the pool.</p>
          </CardContent>
        </Card>
      )}

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
