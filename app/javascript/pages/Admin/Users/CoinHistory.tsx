import { Head, Link } from '@inertiajs/react'
import {
  ArrowLeft,
  Sliders,
  ShoppingCart,
  Undo2,
  CheckCircle2,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react'
import { Card, CardContent } from '@/components/admin/ui/card'
import { Button } from '@/components/admin/ui/button'

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

const TYPE_STYLES: Record<Entry['type'], { color: string; icon: LucideIcon; label: string }> = {
  adjustment: { color: 'text-amber-600 dark:text-amber-400', icon: Sliders, label: 'Manual adjustment' },
  order_placed: { color: 'text-red-600 dark:text-red-400', icon: ShoppingCart, label: 'Order placed' },
  order_refunded: { color: 'text-emerald-600 dark:text-emerald-400', icon: Undo2, label: 'Refund' },
  order_fulfilled: { color: 'text-muted-foreground', icon: CheckCircle2, label: 'Fulfilled' },
  earned: { color: 'text-emerald-600 dark:text-emerald-400', icon: TrendingUp, label: 'Earned' },
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
        <p className="text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  )
}

function renderDetailRow(key: string, value: unknown) {
  if (value === null || value === undefined || value === '') return null
  return (
    <div key={key} className="flex items-start justify-between gap-3 text-xs">
      <span className="text-muted-foreground font-mono">{key}</span>
      <span className="text-right break-all min-w-0">
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
      <div className="max-w-4xl mx-auto space-y-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/admin/users/${user.id}`}>
            <ArrowLeft className="size-4" />
            Back to {user.display_name}
          </Link>
        </Button>

        <div className="flex items-center gap-4">
          <img src={user.avatar} alt={user.display_name} className="size-12 rounded-full" />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Coin history</h1>
            <p className="text-sm text-muted-foreground">Every steel coin movement for {user.display_name}.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatTile label="Balance" value={`${coins.balance}c`} />
          <StatTile label="Earned" value={`${coins.earned}c`} />
          <StatTile label="Spent" value={`${coins.spent}c`} />
          <StatTile label="Adjusted" value={`${coins.adjusted}c`} />
        </div>

        {entries.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center text-sm text-muted-foreground">No coin activity yet.</CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {entries.map((entry, idx) => {
              const style = TYPE_STYLES[entry.type]
              const Icon = style.icon
              const detailKeys = Object.keys(entry.details)
              return (
                <Card key={idx}>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex items-start gap-3 min-w-0">
                        <Icon className={`size-5 shrink-0 ${style.color}`} />
                        <div className="min-w-0">
                          <p className="text-sm break-words">{entry.label}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 uppercase tracking-wide">
                            {style.label} · {entry.date}
                          </p>
                        </div>
                      </div>
                      {entry.amount !== 0 && (
                        <span
                          className={`text-lg font-semibold shrink-0 ${
                            entry.amount >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                          }`}
                        >
                          {entry.amount >= 0 ? '+' : ''}
                          {entry.amount}c
                        </span>
                      )}
                    </div>
                    {detailKeys.length > 0 && (
                      <div className="space-y-1 pl-8 pt-2 border-t border-border">
                        {detailKeys.map((key) => renderDetailRow(key, entry.details[key]))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
