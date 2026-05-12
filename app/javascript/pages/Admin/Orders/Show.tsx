import { useState } from 'react'
import { Head, Link, router } from '@inertiajs/react'
import { ArrowLeft, AlertTriangle, Info, Check, X, CheckCircle2 } from 'lucide-react'
import { Badge } from '@/components/admin/ui/badge'
import { Button } from '@/components/admin/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/admin/ui/card'
import { Textarea } from '@/components/admin/ui/textarea'
import { Input } from '@/components/admin/ui/input'

interface OrderDetail {
  id: number
  kind: 'direct_grant' | 'shop_item'
  kind_label: string
  status: 'pending' | 'approved' | 'fulfilled' | 'rejected'
  quantity: number
  amount_usd: number | null
  coin_cost: number
  description: string | null
  review_notes: string | null
  hcb_grant_link: string | null
  internal_order_link: string | null
  internal_price_usd: number | null
  user_id: number
  user_display_name: string
  user_avatar: string
  user_email: string
  user_balance: number
  project_id: number | null
  project_name: string | null
  shop_item_id: number | null
  shop_item_name: string | null
  shop_item_image: string | null
  region: string | null
  assigned_to_id: number | null
  assigned_to_name: string | null
  reviewer_name: string | null
  reviewed_at: string | null
  fulfilled_at: string | null
  created_at: string
}

interface Warning {
  severity: 'info' | 'warning'
  message: string
}

function statusBadge(status: OrderDetail['status']) {
  switch (status) {
    case 'approved':
      return <Badge variant="success">Approved</Badge>
    case 'fulfilled':
      return <Badge variant="success">Fulfilled</Badge>
    case 'rejected':
      return <Badge variant="destructive">Rejected</Badge>
    default:
      return <Badge variant="warning">Pending</Badge>
  }
}

export default function AdminOrdersShow({
  order,
  warnings,
  regions,
  fulfillment_users,
}: {
  order: OrderDetail
  warnings: Warning[]
  regions: Record<string, string>
  fulfillment_users: { id: number; display_name: string }[]
}) {
  const [reviewNotes, setReviewNotes] = useState('')
  const [grantLink, setGrantLink] = useState('')

  function approve() {
    router.post(`/admin/orders/${order.id}/approve`, { review_notes: reviewNotes })
  }

  function reject() {
    if (!reviewNotes.trim()) {
      alert('Provide a reason for rejecting.')
      return
    }
    if (!confirm('Reject this order? Coins will be refunded to the user.')) return
    router.post(`/admin/orders/${order.id}/reject`, { review_notes: reviewNotes })
  }

  function fulfill() {
    if (!grantLink.trim()) {
      alert('Paste the HCB grant link first.')
      return
    }
    router.post(`/admin/orders/${order.id}/fulfill`, { hcb_grant_link: grantLink })
  }

  return (
    <>
      <Head title={`Order #${order.id} - Admin`} />
      <div className="max-w-4xl mx-auto space-y-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/orders">
            <ArrowLeft className="size-4" />
            All orders
          </Link>
        </Button>

        {warnings.length > 0 && (
          <div className="space-y-2">
            {warnings.map((w, idx) => {
              const Icon = w.severity === 'warning' ? AlertTriangle : Info
              return (
                <Card
                  key={idx}
                  className={
                    w.severity === 'warning'
                      ? 'border-amber-500/40 bg-amber-500/5'
                      : 'border-border bg-muted/40'
                  }
                >
                  <CardContent className="p-3 flex items-start gap-2 text-sm">
                    <Icon className="size-4 shrink-0 mt-0.5" />
                    <p>{w.message}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {order.shop_item_image && (
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <img
                src={order.shop_item_image}
                alt={order.shop_item_name || ''}
                className="size-24 object-cover rounded-md border border-border shrink-0"
              />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Shop item</p>
                <p className="text-lg font-semibold break-words">{order.shop_item_name}</p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{order.created_at}</p>
                <h1 className="text-2xl font-semibold tracking-tight break-words">
                  {order.quantity > 1 ? `${order.quantity}× ` : ''}
                  {order.kind_label}
                </h1>
              </div>
              {statusBadge(order.status)}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="rounded-md bg-muted p-3">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Amount</p>
                <p className="text-xl font-semibold">{order.amount_usd != null ? `$${order.amount_usd}` : '—'}</p>
              </div>
              <div className="rounded-md bg-muted p-3">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Coin cost</p>
                <p className="text-xl font-semibold">{order.coin_cost}c</p>
              </div>
              <div className="rounded-md bg-muted p-3">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">User balance</p>
                <p className="text-xl font-semibold">{order.user_balance}c</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Requested by</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href={`/users/${order.user_id}`} className="flex items-center gap-3 hover:underline">
              <img src={order.user_avatar} alt={order.user_display_name} className="size-10 rounded-full border border-border" />
              <span className="font-medium">{order.user_display_name}</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              HCB email:{' '}
              <a href={`mailto:${order.user_email}`} className="font-mono hover:underline">
                {order.user_email}
              </a>
            </p>
            {order.project_id && (
              <p className="text-sm text-muted-foreground">
                For project:{' '}
                <Link href={`/admin/projects/${order.project_id}`} className="hover:underline text-foreground">
                  {order.project_name}
                </Link>
              </p>
            )}
          </CardContent>
        </Card>

        {order.kind === 'shop_item' && (
          <Card>
            <CardContent className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Region</p>
                <p>{order.region ? regions[order.region] || order.region : 'Not set'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Assigned to</p>
                <select
                  value={order.assigned_to_id?.toString() || ''}
                  onChange={(e) => router.post(`/admin/orders/${order.id}/reassign`, { assigned_to_id: e.target.value })}
                  className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm cursor-pointer"
                >
                  <option value="">Unassigned</option>
                  {fulfillment_users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.display_name}
                    </option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>
        )}

        {order.description && (
          <Card>
            <CardHeader>
              <CardTitle>Notes from user</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap break-words">{order.description}</p>
            </CardContent>
          </Card>
        )}

        {order.review_notes && (
          <Card>
            <CardHeader>
              <CardTitle>Staff review notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap break-words">{order.review_notes}</p>
              {order.reviewer_name && (
                <p className="text-xs text-muted-foreground mt-2">
                  — {order.reviewer_name} on {order.reviewed_at}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {(order.internal_order_link || order.internal_price_usd != null) && (
          <Card>
            <CardHeader>
              <CardTitle>Internal (from shop item)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {order.internal_order_link && (
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-muted-foreground text-xs shrink-0">Order link:</span>
                  <a
                    href={order.internal_order_link}
                    target="_blank"
                    rel="noopener"
                    className="truncate hover:underline"
                  >
                    {order.internal_order_link}
                  </a>
                </div>
              )}
              {order.internal_price_usd != null && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-xs">Cost incl. shipping:</span>
                  <span className="font-semibold">${order.internal_price_usd}</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {order.status === 'pending' && (
          <Card>
            <CardHeader>
              <CardTitle>Review</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Notes for the user (required when rejecting)..."
              />
              <div className="flex gap-2">
                <Button onClick={approve} className="flex-1">
                  <Check className="size-4" />
                  Approve
                </Button>
                <Button onClick={reject} variant="destructive" className="flex-1">
                  <X className="size-4" />
                  Reject
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {order.status === 'approved' && (
          <Card>
            <CardHeader>
              <CardTitle>Mark fulfilled</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">Issue the HCB grant manually or paste the tracking link!</p>
              <Input
                type="url"
                value={grantLink}
                onChange={(e) => setGrantLink(e.target.value)}
                placeholder="https://hcb.hackclub.com/..."
              />
              <Button onClick={fulfill}>
                <CheckCircle2 className="size-4" />
                Mark Fulfilled
              </Button>
            </CardContent>
          </Card>
        )}

        {order.status === 'fulfilled' && order.hcb_grant_link && (
          <Card>
            <CardHeader>
              <CardTitle>Grant link</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <a href={order.hcb_grant_link} target="_blank" rel="noopener" className="text-sm break-all hover:underline">
                {order.hcb_grant_link}
              </a>
              {order.fulfilled_at && <p className="text-xs text-muted-foreground">Fulfilled on {order.fulfilled_at}</p>}
            </CardContent>
          </Card>
        )}
      </div>
    </>
  )
}
