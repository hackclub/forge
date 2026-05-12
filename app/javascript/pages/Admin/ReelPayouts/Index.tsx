import { Head, Link, router } from '@inertiajs/react'
import { ArrowLeft, Check, X } from 'lucide-react'
import { Badge } from '@/components/admin/ui/badge'
import { Button } from '@/components/admin/ui/button'
import { Card, CardContent } from '@/components/admin/ui/card'

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

function statusBadge(status: string) {
  switch (status) {
    case 'approved':
      return <Badge variant="success">Approved</Badge>
    case 'rejected':
      return <Badge variant="destructive">Rejected</Badge>
    case 'pending':
      return <Badge variant="warning">Pending</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
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
      <div className="max-w-6xl mx-auto space-y-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin">
            <ArrowLeft className="size-4" />
            Admin
          </Link>
        </Button>

        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Reel Payouts</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Approve or reject coin payouts for reels. Approving creates a CoinAdjustment for the reel author.
          </p>
        </div>

        <section>
          <h2 className="text-base font-semibold tracking-tight mb-3">Pending ({pending.length})</h2>
          {pending.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-sm text-muted-foreground">No pending payouts.</CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {pending.map((req) => (
                <PayoutRow
                  key={req.id}
                  req={req}
                  actions={
                    <>
                      <Button size="sm" onClick={() => approve(req.id)}>
                        <Check className="size-4" />
                        Approve
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => reject(req.id)}>
                        <X className="size-4" />
                        Reject
                      </Button>
                    </>
                  }
                />
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-base font-semibold tracking-tight mb-3">Recent history</h2>
          {history.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-sm text-muted-foreground">No history yet.</CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
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
    <Card>
      <CardContent className="p-4 flex flex-col md:flex-row md:items-center gap-3">
        <Link href={`/users/${req.reel.user.id}`} className="flex items-center gap-2 shrink-0">
          <img src={req.reel.user.avatar} alt="" className="size-10 rounded-full border border-border" />
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">{req.reel.user.display_name}</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">{req.reel.project.name}</p>
          </div>
        </Link>

        <div className="flex-1 min-w-0">
          <p className="text-sm truncate">{req.reel.title || `${req.reel.kind} reel`}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {req.reel.views} views · {req.reel.kudos} kudos · {req.reel.comments} comments · paid {req.reel.lifetime_paid.toFixed(2)}c lifetime
          </p>
          {req.reason && <p className="text-xs text-muted-foreground italic mt-1">"{req.reason}"</p>}
          <p className="text-[11px] text-muted-foreground mt-1">
            Requested {req.created_at}
            {req.reviewer && ` · ${req.status} by ${req.reviewer.display_name} on ${req.reviewed_at}`}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <p className="text-xl font-semibold tabular-nums">{req.amount.toFixed(2)}c</p>
            {statusBadge(req.status)}
          </div>
          {actions && <div className="flex gap-2">{actions}</div>}
        </div>
      </CardContent>
    </Card>
  )
}
