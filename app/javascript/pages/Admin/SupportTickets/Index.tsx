import { router, Link } from '@inertiajs/react'
import Pagination from '@/components/Pagination'
import type { AdminSupportTicketRow, PagyProps, SupportLeaderboardEntry, SupportTicketStatus } from '@/types'

const statusConfig: Record<SupportTicketStatus, { label: string; bg: string; text: string }> = {
  open: { label: 'Open', bg: 'bg-amber-500/10', text: 'text-amber-400' },
  claimed: { label: 'Claimed', bg: 'bg-blue-500/10', text: 'text-blue-400' },
  resolved: { label: 'Resolved', bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
}

const filters = [
  { key: '', label: 'All' },
  { key: 'open', label: 'Open' },
  { key: 'claimed', label: 'Claimed' },
  { key: 'resolved', label: 'Resolved' },
]

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
    <div className="p-5 md:p-12 max-w-[1400px] mx-auto">
      <h1 className="text-4xl font-headline font-bold text-[#e5e2e1] tracking-tight mb-8">Support Tickets</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Total', value: counts.all, color: 'text-stone-300' },
          { label: 'Open', value: counts.open, color: 'text-amber-400' },
          { label: 'Claimed', value: counts.claimed, color: 'text-blue-400' },
          { label: 'Resolved', value: counts.resolved, color: 'text-emerald-400' },
        ].map((stat) => (
          <div key={stat.label} className="bg-[#1c1b1b] ghost-border p-5">
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-600">{stat.label}</span>
            <p className={`text-2xl font-headline font-bold mt-1 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 md:col-span-8">
          <div className="flex gap-2 flex-wrap mb-6">
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => filterByStatus(f.key)}
                className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] transition-colors cursor-pointer ${
                  status_filter === f.key
                    ? 'signature-smolder text-[#4c1a00]'
                    : 'ghost-border bg-[#1c1b1b] text-stone-500 hover:text-stone-300 hover:bg-[#2a2a2a]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 px-5 py-3 text-[10px] uppercase tracking-[0.2em] font-bold text-stone-600">
              <span className="w-8" />
              <span>Question</span>
              <span>Status</span>
              <span>Assigned</span>
              <span>Created</span>
            </div>
            {tickets.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/admin/support/${ticket.id}`}
                className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 bg-[#1c1b1b] px-5 py-4 ghost-border hover:bg-[#2a2a2a] transition-all group items-center"
              >
                <div className="w-8 h-8 shrink-0">
                  {ticket.slack_avatar_url ? (
                    <img src={ticket.slack_avatar_url} alt={ticket.slack_display_name} className="w-8 h-8 border border-white/10" />
                  ) : (
                    <div className="w-8 h-8 bg-stone-700 flex items-center justify-center text-stone-400 text-xs font-bold">
                      {ticket.slack_display_name?.[0] || '?'}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <span className="font-headline font-bold text-[#e5e2e1] group-hover:text-[#ffb595] transition-colors text-sm">
                    {ticket.slack_display_name}
                  </span>
                  <p className="text-stone-500 text-xs truncate mt-0.5">{ticket.original_text}</p>
                </div>
                <span className={`px-2 py-1 text-[9px] uppercase font-bold tracking-widest ${statusConfig[ticket.status].bg} ${statusConfig[ticket.status].text}`}>
                  {statusConfig[ticket.status].label}
                </span>
                <span className="text-stone-500 text-xs whitespace-nowrap">
                  {ticket.claimed_by_name || ticket.resolved_by_name || '—'}
                </span>
                <span className="text-stone-500 text-xs whitespace-nowrap">{ticket.created_at}</span>
              </Link>
            ))}
            {tickets.length === 0 && (
              <p className="text-stone-500 text-sm py-8 text-center">No tickets found.</p>
            )}
          </div>

          <Pagination pagy={pagy} />
        </div>

        <div className="col-span-12 md:col-span-4">
          <div className="bg-[#1c1b1b] ghost-border p-6">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-stone-500 font-headline mb-4">Leaderboard</h2>
            {leaderboard.length > 0 ? (
              <div className="space-y-3">
                {leaderboard.map((entry, i) => (
                  <div key={entry.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-bold font-headline ${i === 0 ? 'text-amber-400' : i === 1 ? 'text-stone-300' : i === 2 ? 'text-orange-400' : 'text-stone-500'}`}>
                        #{i + 1}
                      </span>
                      <span className="text-[#e5e2e1] text-sm">{entry.name}</span>
                    </div>
                    <span className="text-stone-400 text-sm font-headline font-bold">{entry.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-stone-600 text-sm">No resolved tickets yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
