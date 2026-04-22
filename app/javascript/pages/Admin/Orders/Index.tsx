import { Head, Link, router, usePage } from '@inertiajs/react'
import Pagination from '@/components/Pagination'
import type { PagyProps, SharedProps } from '@/types'

interface OrderRow {
  id: number
  kind: string
  kind_label: string
  status: 'pending' | 'approved' | 'fulfilled' | 'rejected'
  quantity: number
  amount_usd: number | null
  coin_cost: number
  user_id: number
  user_display_name: string
  project_id: number | null
  project_name: string | null
  shop_item_image: string | null
  needs_attention: boolean
  region: string | null
  assigned_to_id: number | null
  assigned_to_name: string | null
  created_at: string
}

interface Props {
  orders: OrderRow[]
  pagy: PagyProps
  filters: { status: string; kind: string; region: string; assigned_to: string }
  counts: { all: number; pending: number; approved: number; fulfilled: number; rejected: number }
  regions: Record<string, string>
  fulfillment_users: { id: number; display_name: string }[]
}

const STATUS_STYLES: Record<OrderRow['status'], string> = {
  pending: 'bg-amber-500/15 text-amber-400',
  approved: 'bg-emerald-500/15 text-emerald-400',
  fulfilled: 'bg-emerald-500/25 text-emerald-300',
  rejected: 'bg-red-500/15 text-red-400',
}

export default function AdminOrdersIndex({ orders, pagy, filters, counts, regions }: Props) {
  const currentUser = usePage<SharedProps>().props.auth.user

  function applyFilter(key: string, value: string) {
    router.get('/admin/orders', { ...filters, [key]: value }, { preserveState: true })
  }

  return (
    <>
      <Head title="Orders - Admin" />
      <div className="p-5 md:p-12 max-w-[1400px] mx-auto">
        <h1 className="text-4xl font-headline font-bold text-[#e5e2e1] tracking-tight mb-2">Orders</h1>
        <p className="text-stone-500 text-sm mb-8">Steel coin orders awaiting review and fulfillment.</p>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
          {(['all', 'pending', 'approved', 'fulfilled', 'rejected'] as const).map((key) => {
            const active = key === 'all' ? !filters.status : filters.status === key
            return (
              <button
                key={key}
                onClick={() => applyFilter('status', key === 'all' ? '' : key)}
                className={`p-4 ghost-border text-left transition-colors ${active ? 'bg-[#ee671c]/15' : 'bg-[#1c1b1b] hover:bg-[#2a2a2a]'}`}
              >
                <p className="text-2xl font-headline font-bold text-[#e5e2e1]">{counts[key]}</p>
                <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-500">{key}</p>
              </button>
            )
          })}
        </div>

        <div className="flex gap-3 mb-8 flex-wrap">
          <button
            onClick={() => applyFilter('assigned_to', filters.assigned_to === 'me' ? '' : 'me')}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] transition-colors cursor-pointer flex items-center gap-2 ${
              filters.assigned_to === 'me'
                ? 'signature-smolder text-[#4c1a00]'
                : 'ghost-border bg-[#1c1b1b] text-stone-400 hover:text-[#e5e2e1] hover:bg-[#2a2a2a]'
            }`}
          >
            <span className="material-symbols-outlined text-sm">person</span>
            My Orders
          </button>
          <select
            value={filters.region}
            onChange={(e) => applyFilter('region', e.target.value)}
            className="bg-[#0e0e0e] border-none px-4 py-2 text-sm text-[#e5e2e1] focus:ring-1 focus:ring-[#ee671c]/30 cursor-pointer"
          >
            <option value="">All Regions</option>
            {Object.entries(regions).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        {orders.length > 0 ? (
          <>
            <div className="ghost-border overflow-x-auto">
              <table className="w-full min-w-[720px]">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left px-5 py-3 text-[10px] uppercase tracking-[0.2em] font-bold text-stone-600">Order</th>
                    <th className="text-left px-5 py-3 text-[10px] uppercase tracking-[0.2em] font-bold text-stone-600">User</th>
                    <th className="text-left px-5 py-3 text-[10px] uppercase tracking-[0.2em] font-bold text-stone-600">Region</th>
                    <th className="text-left px-5 py-3 text-[10px] uppercase tracking-[0.2em] font-bold text-stone-600">Assigned To</th>
                    <th className="text-left px-5 py-3 text-[10px] uppercase tracking-[0.2em] font-bold text-stone-600">Cost</th>
                    <th className="text-left px-5 py-3 text-[10px] uppercase tracking-[0.2em] font-bold text-stone-600">Status</th>
                    <th className="text-left px-5 py-3 text-[10px] uppercase tracking-[0.2em] font-bold text-stone-600">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b border-white/5 hover:bg-[#1c1b1b] transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3 min-w-0">
                          {order.shop_item_image && (
                            <img src={order.shop_item_image} alt="" className="w-10 h-10 object-cover shrink-0" />
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Link href={`/admin/orders/${order.id}`} className="font-headline font-bold text-[#e5e2e1] hover:text-[#ffb595] transition-colors text-sm">
                                {order.quantity > 1 ? `${order.quantity}× ` : ''}{order.kind_label}
                              </Link>
                              {order.needs_attention && (
                                <span className="bg-amber-500/15 text-amber-400 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider flex items-center gap-1">
                                  <span className="material-symbols-outlined text-[12px]">warning</span>
                                  Check funding
                                </span>
                              )}
                            </div>
                            {order.project_name && (
                              <p className="text-stone-500 text-xs mt-0.5">{order.project_name}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-stone-400 text-sm">{order.user_display_name}</td>
                      <td className="px-5 py-4 text-stone-500 text-xs">{order.region ? regions[order.region] || order.region : '-'}</td>
                      <td className="px-5 py-4 text-stone-400 text-xs">{order.assigned_to_name || '-'}</td>
                      <td className="px-5 py-4 text-sm">
                        <span className="text-[#ee671c] font-bold">{order.coin_cost}c</span>
                        {order.amount_usd != null && <span className="text-stone-600 ml-2">${order.amount_usd}</span>}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 ${STATUS_STYLES[order.status]}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-stone-500 text-xs">{order.created_at}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination pagy={pagy} />
          </>
        ) : (
          <div className="ghost-border bg-[#1c1b1b] p-16 text-center">
            <p className="text-stone-300 text-lg font-headline font-medium mb-2">No orders</p>
            <p className="text-stone-500 text-sm">Nothing to review yet.</p>
          </div>
        )}
      </div>
    </>
  )
}
