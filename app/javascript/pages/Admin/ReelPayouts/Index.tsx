import { Head, Link, router } from '@inertiajs/react'

interface PayoutRequest {
  id: number
  amount: number
  status: 'pending' | 'approved' | 'rejected' | string
  reason: string | null
  created_at: string
  reviewed_at: string | null
  reviewer: { id: number; display_name: string } | null
  reel: {
    id: number
    kind: string
    title: string | null
    views: number
    kudos: number
    comments: number
    lifetime_paid: number
    user: { id: number; display_name: string; avatar: string }
    project: { id: number; name: string }
  }
}

interface Props {
  pending: PayoutRequest[]
  history: PayoutRequest[]
}

const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-amber-500/15 text-amber-300',
  approved: 'bg-emerald-500/15 text-emerald-300',
  rejected: 'bg-red-500/15 text-red-300',
}

export default function AdminReelPayoutsIndex({ pending, history }: Props) {
  function approve(id: number) {
    router.post(`/admin/reel_payouts/${id}/approve`)
  }
  function reject(id: number) {
    const reason = prompt('Reason (optional):') ?? ''
    router.post(`/admin/reel_payouts/${id}/reject`, { reason })
  }

  return (
    <>
      <Head title="Reel Payouts — Admin" />
      <div className="p-5 md:p-12 max-w-6xl mx-auto">
        <Link
          href="/admin"
          className="ghost-border inline-block px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-stone-500 hover:text-[#e5e2e1] transition-colors mb-6"
        >
          ← Admin
        </Link>
        <h1 className="text-3xl sm:text-4xl font-headline font-bold tracking-tight text-[#e5e2e1] mb-2">
          Reel Payouts
        </h1>
        <p className="text-stone-500 text-sm mb-10">
          Approve or reject coin payouts for reels. Approving creates a CoinAdjustment for the reel author.
        </p>

        <section className="mb-12">
          <h2 className="text-xl font-headline font-bold text-[#e5e2e1] mb-4">
            Pending ({pending.length})
          </h2>
          {pending.length === 0 ? (
            <div className="bg-[#1c1b1b] ghost-border p-8 text-center text-stone-500 text-sm">
              No pending payouts.
            </div>
          ) : (
            <div className="space-y-3">
              {pending.map((req) => (
                <PayoutRow key={req.id} req={req} actions={
                  <>
                    <button
                      type="button"
                      onClick={() => approve(req.id)}
                      className="bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-300 px-4 py-2 text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">check</span>
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => reject(req.id)}
                      className="bg-red-500/10 hover:bg-red-500/30 text-red-300 px-4 py-2 text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">close</span>
                      Reject
                    </button>
                  </>
                } />
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-xl font-headline font-bold text-[#e5e2e1] mb-4">Recent history</h2>
          {history.length === 0 ? (
            <div className="bg-[#1c1b1b] ghost-border p-8 text-center text-stone-500 text-sm">
              No history yet.
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((req) => (
                <PayoutRow key={req.id} req={req} />
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  )
}

function PayoutRow({ req, actions }: { req: PayoutRequest; actions?: React.ReactNode }) {
  return (
    <div className="bg-[#1c1b1b] ghost-border p-5 flex flex-col md:flex-row md:items-center gap-4">
      <Link href={`/users/${req.reel.user.id}`} className="flex items-center gap-3 shrink-0">
        <img src={req.reel.user.avatar} alt="" className="w-10 h-10 rounded-full border border-white/10" />
        <div className="min-w-0">
          <p className="font-headline font-bold text-[#e5e2e1] text-sm truncate">{req.reel.user.display_name}</p>
          <p className="text-[10px] text-stone-600 uppercase tracking-widest">{req.reel.project.name}</p>
        </div>
      </Link>

      <div className="flex-1 min-w-0">
        <p className="text-stone-300 text-sm truncate">{req.reel.title || `${req.reel.kind} reel`}</p>
        <p className="text-[10px] text-stone-600 uppercase tracking-widest mt-0.5">
          {req.reel.views} views · {req.reel.kudos} kudos · {req.reel.comments} comments · paid {req.reel.lifetime_paid.toFixed(2)}c lifetime
        </p>
        {req.reason && <p className="text-[10px] text-stone-500 mt-1 italic">"{req.reason}"</p>}
        <p className="text-[10px] text-stone-700 mt-1">
          Requested {req.created_at}
          {req.reviewer && ` · ${req.status} by ${req.reviewer.display_name} on ${req.reviewed_at}`}
        </p>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <div className="text-right">
          <p className="text-[#ffb595] font-headline font-bold text-2xl tabular-nums">{req.amount.toFixed(2)}c</p>
          <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 ${STATUS_COLOR[req.status] || 'bg-stone-500/15 text-stone-400'}`}>
            {req.status}
          </span>
        </div>
        {actions && <div className="flex gap-2">{actions}</div>}
      </div>
    </div>
  )
}
