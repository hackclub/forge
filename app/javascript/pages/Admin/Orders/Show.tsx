import { useState } from 'react'
import { Head, Link, router } from '@inertiajs/react'

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

const STATUS_STYLES: Record<OrderDetail['status'], string> = {
  pending: 'bg-amber-500/15 text-amber-400',
  approved: 'bg-emerald-500/15 text-emerald-400',
  fulfilled: 'bg-emerald-500/25 text-emerald-300',
  rejected: 'bg-red-500/15 text-red-400',
}

export default function AdminOrdersShow({ order, warnings, regions, fulfillment_users }: { order: OrderDetail; warnings: Warning[]; regions: Record<string, string>; fulfillment_users: { id: number; display_name: string }[] }) {
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
      <Head title={`Order #${order.id} — Admin`} />
      <div className="p-5 md:p-12 max-w-4xl mx-auto space-y-8">
        <Link href="/admin/orders" className="text-stone-500 text-sm hover:text-[#ffb595] transition-colors flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          All orders
        </Link>

        {warnings.length > 0 && (
          <div className="space-y-2">
            {warnings.map((w, idx) => (
              <div
                key={idx}
                className={`p-4 border flex items-start gap-3 ${
                  w.severity === 'warning'
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                    : 'bg-stone-500/10 border-stone-500/20 text-stone-300'
                }`}
              >
                <span className="material-symbols-outlined text-base shrink-0">
                  {w.severity === 'warning' ? 'warning' : 'info'}
                </span>
                <p className="text-sm leading-relaxed">{w.message}</p>
              </div>
            ))}
          </div>
        )}

        {order.shop_item_image && (
          <div className="bg-[#1c1b1b] ghost-border p-6 flex items-center gap-5">
            <img src={order.shop_item_image} alt={order.shop_item_name || ''} className="w-24 h-24 object-cover shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500 mb-1">Shop item</p>
              <p className="font-headline font-bold text-[#e5e2e1] text-lg break-words">{order.shop_item_name}</p>
            </div>
          </div>
        )}

        <div className="bg-[#1c1b1b] ghost-border p-8">
          <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500 mb-1">{order.created_at}</p>
              <h1 className="text-3xl font-headline font-bold text-[#e5e2e1] tracking-tight break-words">
                {order.quantity > 1 ? `${order.quantity}× ` : ''}{order.kind_label}
              </h1>
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 ${STATUS_STYLES[order.status]}`}>
              {order.status}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6">
            <div className="bg-[#0e0e0e] p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500 mb-1">Amount</p>
              <p className="text-2xl font-headline font-bold text-[#e5e2e1]">
                {order.amount_usd != null ? `$${order.amount_usd}` : '—'}
              </p>
            </div>
            <div className="bg-[#0e0e0e] p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500 mb-1">Coin cost</p>
              <p className="text-2xl font-headline font-bold text-[#ee671c]">{order.coin_cost}c</p>
            </div>
            <div className="bg-[#0e0e0e] p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500 mb-1">User balance</p>
              <p className="text-2xl font-headline font-bold text-[#e5e2e1]">{order.user_balance}c</p>
            </div>
          </div>
        </div>

        <div className="bg-[#1c1b1b] ghost-border p-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500 mb-3">Requested by</p>
          <Link href={`/users/${order.user_id}`} className="flex items-center gap-3 group">
            <img src={order.user_avatar} alt={order.user_display_name} className="w-10 h-10 border border-white/10" />
            <span className="text-[#e5e2e1] group-hover:text-[#ffb595] transition-colors font-headline font-bold">
              {order.user_display_name}
            </span>
          </Link>
          {order.project_id && (
            <p className="text-stone-500 text-sm mt-3">
              For project:{' '}
              <Link href={`/admin/projects/${order.project_id}`} className="text-[#ffb595] hover:text-[#ee671c]">
                {order.project_name}
              </Link>
            </p>
          )}
        </div>

        {order.kind === 'shop_item' && (
          <div className="bg-[#1c1b1b] ghost-border p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500 mb-3">Region</p>
              <p className="text-[#e5e2e1] text-sm">{order.region ? regions[order.region] || order.region : 'Not set'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500 mb-3">Assigned to</p>
              <select
                value={order.assigned_to_id?.toString() || ''}
                onChange={(e) => router.post(`/admin/orders/${order.id}/reassign`, { assigned_to_id: e.target.value })}
                className="w-full bg-[#0e0e0e] border-none px-4 py-3 text-[#e5e2e1] text-sm focus:ring-1 focus:ring-[#ee671c]/30 cursor-pointer"
              >
                <option value="">Unassigned</option>
                {fulfillment_users.map((u) => (
                  <option key={u.id} value={u.id}>{u.display_name}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {order.description && (
          <div className="bg-[#1c1b1b] ghost-border p-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500 mb-3">Notes from user</p>
            <p className="text-stone-300 text-sm whitespace-pre-wrap break-words">{order.description}</p>
          </div>
        )}

        {order.review_notes && (
          <div className="bg-[#1c1b1b] ghost-border p-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500 mb-3">Staff review notes</p>
            <p className="text-stone-300 text-sm whitespace-pre-wrap break-words">{order.review_notes}</p>
            {order.reviewer_name && (
              <p className="text-stone-600 text-xs mt-2">— {order.reviewer_name} on {order.reviewed_at}</p>
            )}
          </div>
        )}

        {(order.internal_order_link || order.internal_price_usd != null) && (
          <div className="bg-[#1c1b1b] ghost-border p-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500 mb-3">Internal (from shop item)</p>
            <div className="space-y-2 text-sm">
              {order.internal_order_link && (
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-stone-500 text-xs shrink-0">Order link:</span>
                  <a href={order.internal_order_link} target="_blank" rel="noopener" className="text-[#ffb595] hover:text-[#ee671c] truncate">
                    {order.internal_order_link}
                  </a>
                </div>
              )}
              {order.internal_price_usd != null && (
                <div className="flex items-center gap-2">
                  <span className="text-stone-500 text-xs">Cost incl. shipping:</span>
                  <span className="text-[#e5e2e1] font-headline font-bold">${order.internal_price_usd}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {order.status === 'pending' && (
          <div className="bg-[#1c1b1b] ghost-border p-6 space-y-4">
            <h2 className="text-xl font-headline font-bold text-[#e5e2e1] tracking-tight">Review</h2>
            <textarea
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              rows={3}
              placeholder="Notes for the user (required when rejecting)..."
              className="w-full bg-[#0e0e0e] border-none px-4 py-3 text-[#e5e2e1] text-sm focus:ring-1 focus:ring-[#ee671c]/30 placeholder:text-stone-600 resize-y"
            />
            <div className="flex gap-3">
              <button
                onClick={approve}
                className="flex-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 font-headline font-bold py-3 uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">check</span>
                Approve
              </button>
              <button
                onClick={reject}
                className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-headline font-bold py-3 uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">close</span>
                Reject
              </button>
            </div>
          </div>
        )}

        {order.status === 'approved' && (
          <div className="bg-[#1c1b1b] ghost-border p-6 space-y-4">
            <h2 className="text-xl font-headline font-bold text-[#e5e2e1] tracking-tight">Mark fulfilled</h2>
            <p className="text-stone-500 text-sm">Issue the HCB grant manually or paste the tracking link!</p>
            <input
              type="url"
              value={grantLink}
              onChange={(e) => setGrantLink(e.target.value)}
              placeholder="https://hcb.hackclub.com/..."
              className="w-full bg-[#0e0e0e] border-none px-4 py-3 text-[#e5e2e1] text-sm focus:ring-1 focus:ring-[#ee671c]/30 placeholder:text-stone-600"
            />
            <button
              onClick={fulfill}
              className="signature-smolder text-[#4c1a00] px-5 py-3 font-bold uppercase tracking-wider text-xs cursor-pointer flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-base">check_circle</span>
              Mark Fulfilled
            </button>
          </div>
        )}

        {order.status === 'fulfilled' && order.hcb_grant_link && (
          <div className="bg-[#1c1b1b] ghost-border p-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500 mb-3">Grant link</p>
            <a href={order.hcb_grant_link} target="_blank" rel="noopener" className="text-[#ffb595] hover:text-[#ee671c] text-sm break-all">
              {order.hcb_grant_link}
            </a>
            {order.fulfilled_at && (
              <p className="text-stone-600 text-xs mt-2">Fulfilled on {order.fulfilled_at}</p>
            )}
          </div>
        )}
      </div>
    </>
  )
}
