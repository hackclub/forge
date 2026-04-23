import { router, Link } from '@inertiajs/react'

interface Referral {
  id: number
  status: 'pending' | 'eligible' | 'approved'
  referred: { id: number; display_name: string; avatar: string }
  qualifying_project: { id: number; name: string } | null
  eligible_at: string | null
  approved_at: string | null
  created_at: string
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

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-stone-500/20 text-stone-400',
  eligible: 'bg-amber-500/20 text-amber-400',
  approved: 'bg-emerald-500/20 text-emerald-400',
}

export default function AdminReferralsShow({
  user,
  referrals,
  stats,
}: {
  user: { id: number; display_name: string; avatar: string; referral_code: string }
  referrals: Referral[]
  stats: Stats
}) {
  const eligibleCount = referrals.filter((r) => r.status === 'eligible').length

  function approveOne(id: number) {
    if (!confirm('Approve this referral and pay out the referrer?')) return
    router.post(`/admin/referrals/approve/${id}`)
  }

  function approveAll() {
    if (eligibleCount === 0) return
    if (!confirm(`Approve all ${eligibleCount} eligible referrals for ${user.display_name}?`)) return
    router.post(`/admin/referrals/${user.id}/approve_all`)
  }

  return (
    <div className="p-5 md:p-12 max-w-[1100px] mx-auto">
      <Link
        href="/admin/referrals"
        className="ghost-border inline-block px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-stone-500 hover:text-[#e5e2e1] transition-colors mb-6"
      >
        ← Back to Referrals
      </Link>

      <div className="flex items-center gap-4 mb-8">
        <img src={user.avatar} alt="" className="w-16 h-16 object-cover" />
        <div className="flex-1">
          <h1 className="text-3xl font-headline font-bold text-[#e5e2e1] tracking-tight">{user.display_name}</h1>
          <p className="text-stone-500 text-sm mt-1">
            Referral code: <span className="font-mono text-[#ffb595]">{user.referral_code}</span>
          </p>
        </div>
        {eligibleCount > 0 && (
          <button
            onClick={approveAll}
            className="signature-smolder text-[#4c1a00] px-6 py-3 font-bold uppercase tracking-wider text-xs cursor-pointer flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">done_all</span>
            Approve All ({eligibleCount})
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 mb-8">
        <StatCard label="Total" value={referrals.length} />
        <StatCard label="Eligible" value={eligibleCount} />
        <StatCard label="Approved" value={referrals.filter((r) => r.status === 'approved').length} />
      </div>

      {referrals.length === 0 ? (
        <div className="ghost-border bg-[#1c1b1b] p-16 text-center">
          <p className="text-stone-300 text-lg font-headline font-medium mb-2">No referrals</p>
          <p className="text-stone-500 text-sm">This user hasn't referred anyone yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {referrals.map((r) => (
            <div key={r.id} className="bg-[#1c1b1b] px-5 py-4 ghost-border flex items-center gap-4">
              <img src={r.referred.avatar} alt="" className="w-10 h-10 object-cover" />
              <div className="flex-1 min-w-0">
                <Link
                  href={`/admin/users/${r.referred.id}`}
                  className="font-headline font-bold text-[#e5e2e1] hover:text-[#ffb595] transition-colors truncate block"
                >
                  {r.referred.display_name}
                </Link>
                <p className="text-stone-500 text-xs mt-1">
                  Signed up {r.created_at}
                  {r.qualifying_project && (
                    <>
                      {' '}
                      · Shipped{' '}
                      <Link href={`/projects/${r.qualifying_project.id}`} className="hover:text-[#ffb595]">
                        {r.qualifying_project.name}
                      </Link>
                    </>
                  )}
                </p>
              </div>
              <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${STATUS_STYLES[r.status]}`}>
                {r.status}
              </span>
              {r.status === 'eligible' && (
                <button
                  onClick={() => approveOne(r.id)}
                  className="signature-smolder text-[#4c1a00] px-4 py-2 font-bold uppercase tracking-wider text-[10px] cursor-pointer"
                >
                  Approve
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <p className="text-stone-600 text-xs mt-8">
        Approved referrals pay out 0.25c to the referrer and add 0.1c to the prize pool ({stats.prize_pool.toFixed(2)}c
        current).
      </p>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="ghost-border bg-[#1c1b1b] p-4">
      <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-500 mb-2">{label}</p>
      <p className="font-headline font-bold text-2xl text-[#e5e2e1]">{value}</p>
    </div>
  )
}
