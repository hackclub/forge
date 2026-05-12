import { router, Link } from '@inertiajs/react'
import { Trophy } from 'lucide-react'
import { Badge } from '@/components/admin/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/admin/ui/card'
import AdminPagination from '@/components/admin/AdminPagination'
import { cn } from '@/components/admin/lib/cn'
import type { AdminSupportTicketRow, PagyProps, SupportLeaderboardEntry, SupportTicketStatus } from '@/types'

const filters = [
  { key: '', label: 'All' },
  { key: 'open', label: 'Open' },
  { key: 'claimed', label: 'Claimed' },
  { key: 'resolved', label: 'Resolved' },
]

function statusBadge(status: SupportTicketStatus) {
  switch (status) {
    case 'open':
      return <Badge variant="warning">Open</Badge>
    case 'claimed':
      return <Badge variant="secondary">Claimed</Badge>
    case 'resolved':
      return <Badge variant="success">Resolved</Badge>
  }
}

export default function AdminSupportTicketsIndex({
  tickets,
  pagy,
  status_filter,
  counts,
  leaderboard,
}: {
  tickets: AdminSupportTicketRow[]
  pagy: PagyProps
  status_filter: string
  counts: { all: number; open: number; claimed: number; resolved: number }
  leaderboard: SupportLeaderboardEntry[]
}) {
  function filterByStatus(status: string) {
    router.get('/admin/support', { status: status || undefined }, { preserveState: true })
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Support Tickets</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: counts.all },
          { label: 'Open', value: counts.open },
          { label: 'Claimed', value: counts.claimed },
          { label: 'Resolved', value: counts.resolved },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">{stat.label}</span>
              <p className="text-2xl font-semibold mt-1">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 md:col-span-8 space-y-4">
          <div className="flex gap-2 flex-wrap">
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => filterByStatus(f.key)}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-md border transition-colors cursor-pointer',
                  status_filter === f.key
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground',
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          {tickets.length === 0 ? (
            <Card>
              <CardContent className="p-10 text-center text-sm text-muted-foreground">No tickets found.</CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {tickets.map((ticket) => (
                <Link key={ticket.id} href={`/admin/support/${ticket.id}`} className="block group">
                  <Card className="group-hover:bg-accent transition-colors">
                    <CardContent className="p-3 flex items-center gap-3">
                      {ticket.slack_avatar_url ? (
                        <img src={ticket.slack_avatar_url} alt="" className="size-8 rounded-full shrink-0" />
                      ) : (
                        <div className="size-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm font-medium shrink-0">
                          {ticket.slack_display_name?.[0] || '?'}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{ticket.slack_display_name}</p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{ticket.original_text}</p>
                      </div>
                      {statusBadge(ticket.status)}
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {ticket.claimed_by_name || ticket.resolved_by_name || '—'}
                      </span>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">{ticket.created_at}</span>
                    </CardContent>
                  </Card>
                </Link>
              ))}
              {pagy && pagy.pages > 1 && <AdminPagination pagy={pagy} />}
            </div>
          )}
        </div>

        <div className="col-span-12 md:col-span-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="size-4" />
                Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              {leaderboard.length === 0 ? (
                <p className="text-sm text-muted-foreground">No resolved tickets yet.</p>
              ) : (
                <div className="space-y-2">
                  {leaderboard.map((entry, i) => (
                    <div key={entry.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            'text-sm font-semibold',
                            i === 0 && 'text-amber-600 dark:text-amber-400',
                            i === 1 && 'text-foreground',
                            i === 2 && 'text-orange-600 dark:text-orange-400',
                            i > 2 && 'text-muted-foreground',
                          )}
                        >
                          #{i + 1}
                        </span>
                        <span className="text-sm">{entry.name}</span>
                      </div>
                      <span className="text-sm font-medium">{entry.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
