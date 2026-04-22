import { router, Link } from '@inertiajs/react'

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
    if (!confirm('Reset the prize pool to 0? This adds the current pool to total paid out.')) return
    router.post('/admin/referrals/reset_pool')
  }

  function forceApproveAll() {
    if (!confirm('Pay out every non-approved referral, including pending ones where the referred builder has NOT shipped? This cannot be undone.')) return
    router.post('/admin/referrals/force_approve_all')
  }

  return (
    <div className="p-5 md:p-12 max-w-[1400px] mx-auto">
      <h1 className="text-4xl font-headline font-bold text-[#e5e2e1] tracking-tight mb-8">Referrals</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <StatCard label="Total Referrals" value={stats.total_unique_referrals} />
        <StatCard label="Approved" value={stats.approved_count} />
        <StatCard label="Eligible" value={stats.eligible_count} />
        <StatCard label="Pending Ship" value={stats.pending_count} />
        <StatCard label="Prize Pool" value={`${stats.prize_pool.toFixed(2)}c`} accent />
        <StatCard label="Total Pool Paid" value={`${stats.total_paid_out_to_pool.toFixed(2)}c`} />
        <StatCard label="Total Spend" value={`${stats.total_referral_spend.toFixed(2)}c`} />
      </div>

      <div className="flex gap-3 mb-8 flex-wrap">
        <button
          onClick={drawWinner}
          className="signature-smolder text-[#4c1a00] px-6 py-3 font-bold uppercase tracking-wider text-xs cursor-pointer flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-lg">casino</span>
          Draw Winner
        </button>
        <button
          onClick={resetPool}
          className="ghost-border bg-[#1c1b1b] text-stone-400 hover:bg-[#2a2a2a] px-6 py-3 font-bold uppercase tracking-wider text-xs cursor-pointer flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-lg">restart_alt</span>
          Reset Pool
        </button>
        <button
          onClick={forceApproveAll}
          className="border border-red-500/40 bg-red-500/10 text-red-300 hover:bg-red-500/20 px-6 py-3 font-bold uppercase tracking-wider text-xs cursor-pointer flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-lg">bolt</span>
          Pay Out All
        </button>
      </div>

      {winner && (
        <div className="ghost-border bg-[#1c1b1b] p-6 mb-8 border border-[#ee671c]/30">
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#ffb595] mb-3">Winner Drawn</p>
          <div className="flex items-center gap-4">
            <img src={winner.avatar} alt="" className="w-12 h-12 object-cover" />
            <div className="flex-1">
              <Link href={`/admin/users/${winner.id}`} className="font-headline font-bold text-[#e5e2e1] text-xl hover:text-[#ffb595] transition-colors">
                {winner.display_name}
              </Link>
              <p className="text-stone-500 text-sm">
                Had {winner.tickets} ticket{winner.tickets === 1 ? '' : 's'} · Pool was {winner.pool_amount.toFixed(2)}c
              </p>
            </div>
            <p className="text-stone-500 text-xs">Pay out manually, then reset the pool.</p>
          </div>
        </div>
      )}

      <div className="space-y-2 overflow-x-auto">
        <div className="hidden md:grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-5 py-3 text-[10px] uppercase tracking-[0.2em] font-bold text-stone-600 min-w-[720px]">
          <span>Referrer</span>
          <span>Code</span>
          <span>Total</span>
          <span>Eligible</span>
          <span>Approved</span>
        </div>
        {users.length === 0 ? (
          <div className="ghost-border bg-[#1c1b1b] p-16 text-center">
            <p className="text-stone-300 text-lg font-headline font-medium mb-2">No referrals yet</p>
            <p className="text-stone-500 text-sm">Users get credit once their referred builder ships a project.</p>
          </div>
        ) : (
          users.map((user) => (
            <Link
              key={user.id}
              href={`/admin/referrals/${user.id}`}
              className="flex flex-col gap-1 md:grid md:grid-cols-[1fr_auto_auto_auto_auto] md:gap-4 bg-[#1c1b1b] px-5 py-4 ghost-border hover:bg-[#2a2a2a] transition-all group md:min-w-[720px]"
            >
              <span className="flex items-center gap-3">
                <img src={user.avatar} alt="" className="w-8 h-8 object-cover" />
                <span className="font-headline font-bold text-[#e5e2e1] group-hover:text-[#ffb595] transition-colors truncate">
                  {user.display_name}
                </span>
              </span>
              <span className="font-mono text-stone-500 text-xs">{user.referral_code}</span>
              <span className="text-stone-400 text-sm">{user.total}</span>
              <span className="text-amber-400 text-sm">{user.eligible_count}</span>
              <span className="text-emerald-400 text-sm">{user.approved_count}</span>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className={`ghost-border bg-[#1c1b1b] p-4 ${accent ? 'border border-[#ee671c]/30' : ''}`}>
      <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-500 mb-2">{label}</p>
      <p className={`font-headline font-bold text-2xl ${accent ? 'text-[#ffb595]' : 'text-[#e5e2e1]'}`}>{value}</p>
    </div>
  )
}
