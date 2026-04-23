import { Head, Link } from '@inertiajs/react'

interface ProfileUser {
  id: number
  display_name: string
  avatar: string
}

interface CoinSummary {
  balance: number
  earned: number
  spent: number
  adjusted: number
}

interface Entry {
  at: string
  date: string
  type: 'adjustment' | 'order_placed' | 'order_refunded' | 'order_fulfilled' | 'earned'
  amount: number
  label: string
  details: Record<string, string | number | null>
}

const TYPE_STYLES: Record<Entry['type'], { color: string; icon: string; label: string }> = {
  adjustment: { color: 'text-amber-400', icon: 'tune', label: 'Manual adjustment' },
  order_placed: { color: 'text-red-400', icon: 'shopping_cart', label: 'Order placed' },
  order_refunded: { color: 'text-emerald-400', icon: 'undo', label: 'Refund' },
  order_fulfilled: { color: 'text-stone-400', icon: 'check_circle', label: 'Fulfilled' },
  earned: { color: 'text-emerald-400', icon: 'trending_up', label: 'Earned' },
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#1c1b1b] ghost-border p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500 mb-1">{label}</p>
      <p className="text-2xl font-headline font-bold text-[#e5e2e1]">{value}</p>
    </div>
  )
}

function renderDetailRow(key: string, value: unknown) {
  if (value === null || value === undefined || value === '') return null
  return (
    <div key={key} className="flex items-start justify-between gap-3 text-xs">
      <span className="text-stone-600 font-mono">{key}</span>
      <span className="text-stone-300 text-right break-all [overflow-wrap:anywhere] min-w-0">
        {typeof value === 'string' || typeof value === 'number' ? String(value) : JSON.stringify(value)}
      </span>
    </div>
  )
}

export default function AdminUsersCoinHistory({
  user,
  coins,
  entries,
}: {
  user: ProfileUser
  coins: CoinSummary
  entries: Entry[]
}) {
  return (
    <>
      <Head title={`Coin history - ${user.display_name}`} />
      <div className="p-5 md:p-12 max-w-4xl mx-auto space-y-8">
        <Link
          href={`/admin/users/${user.id}`}
          className="text-stone-500 text-sm hover:text-[#ffb595] transition-colors flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Back to {user.display_name}
        </Link>

        <div className="flex items-center gap-4">
          <img src={user.avatar} alt={user.display_name} className="w-14 h-14 border border-white/10" />
          <div>
            <h1 className="text-3xl font-headline font-bold text-[#e5e2e1] tracking-tight">Coin history</h1>
            <p className="text-stone-500 text-sm">Every steel coin movement for {user.display_name}.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatTile label="Balance" value={`${coins.balance}c`} />
          <StatTile label="Earned" value={`${coins.earned}c`} />
          <StatTile label="Spent" value={`${coins.spent}c`} />
          <StatTile label="Adjusted" value={`${coins.adjusted}c`} />
        </div>

        {entries.length === 0 ? (
          <div className="bg-[#1c1b1b] ghost-border p-12 text-center">
            <p className="text-stone-500 text-sm">No coin activity yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map((entry, idx) => {
              const style = TYPE_STYLES[entry.type]
              const detailKeys = Object.keys(entry.details)
              return (
                <div key={idx} className="bg-[#1c1b1b] ghost-border p-5 min-w-0 overflow-hidden">
                  <div className="flex items-start justify-between gap-4 mb-3 flex-wrap">
                    <div className="flex items-start gap-3 min-w-0">
                      <span className={`material-symbols-outlined text-xl shrink-0 ${style.color}`}>{style.icon}</span>
                      <div className="min-w-0">
                        <p className="text-[#e5e2e1] text-sm break-words">{entry.label}</p>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-stone-600 mt-0.5">
                          {style.label} · {entry.date}
                        </p>
                      </div>
                    </div>
                    {entry.amount !== 0 && (
                      <span
                        className={`text-xl font-headline font-bold shrink-0 ${entry.amount >= 0 ? 'text-emerald-400' : 'text-red-400'}`}
                      >
                        {entry.amount >= 0 ? '+' : ''}
                        {entry.amount}c
                      </span>
                    )}
                  </div>
                  {detailKeys.length > 0 && (
                    <div className="space-y-1 pl-8 pt-2 border-t border-white/5">
                      {detailKeys.map((key) => renderDetailRow(key, entry.details[key]))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
