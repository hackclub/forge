import { useState } from 'react'
import { Head, router } from '@inertiajs/react'

interface Balance {
  balance: number
  earned: number
  spent: number
}

interface EligibleProject {
  id: number
  name: string
  tier: string
  coin_rate: number
  coins_earned: number
  total_hours: number
  built: boolean
  built_at: string | null
}

interface ShopItem {
  id: number
  name: string
  description: string | null
  image_url: string | null
  coin_cost: number
  max_quantity: number | null
}

interface Order {
  id: number
  kind: 'direct_grant' | 'shop_item'
  kind_label: string
  status: 'pending' | 'approved' | 'fulfilled' | 'rejected'
  quantity: number
  amount_usd: number | null
  coin_cost: number
  description: string | null
  project_name: string | null
  shop_item_name: string | null
  shop_item_image: string | null
  hcb_grant_link: string | null
  created_at: string
}

interface Transaction {
  date: string
  type: 'adjustment' | 'order_placed' | 'order_refunded' | 'order_fulfilled' | 'earned'
  amount: number
  label: string
}

interface Props {
  balance: Balance
  can_buy_shop_items: boolean
  eligible_projects: EligibleProject[]
  shop_items: ShopItem[]
  orders: Order[]
  transactions: Transaction[]
  direct_grant_ratio: number
}

const STATUS_STYLES: Record<Order['status'], string> = {
  pending: 'bg-amber-500/15 text-amber-400',
  approved: 'bg-emerald-500/15 text-emerald-400',
  fulfilled: 'bg-emerald-500/25 text-emerald-300',
  rejected: 'bg-red-500/15 text-red-400',
}

export default function ShopIndex({ balance, can_buy_shop_items, eligible_projects, shop_items, orders, transactions, direct_grant_ratio }: Props) {
  const [showDirectForm, setShowDirectForm] = useState(false)
  const [showOrders, setShowOrders] = useState(false)
  const [showTransactions, setShowTransactions] = useState(false)
  const [projectId, setProjectId] = useState<string>(eligible_projects[0]?.id.toString() || '')
  const [amount, setAmount] = useState<string>('')
  const [description, setDescription] = useState('')

  const numericAmount = parseFloat(amount) || 0
  const directCost = +(numericAmount * direct_grant_ratio).toFixed(2)
  const canAffordDirect = directCost > 0 && directCost <= balance.balance && projectId

  function placeDirect(e: React.FormEvent) {
    e.preventDefault()
    if (!canAffordDirect) return
    router.post('/shop/orders', {
      kind: 'direct_grant',
      project_id: projectId,
      amount_usd: numericAmount,
      description: description.trim(),
    }, {
      onSuccess: () => {
        setAmount('')
        setDescription('')
        setShowDirectForm(false)
      },
    })
  }

  const [quantities, setQuantities] = useState<Record<number, number>>({})

  function getQuantity(item: ShopItem) {
    return quantities[item.id] ?? 1
  }

  function setQuantity(item: ShopItem, qty: number) {
    const max = item.max_quantity ?? 999
    const clamped = Math.max(1, Math.min(qty, max))
    setQuantities((prev) => ({ ...prev, [item.id]: clamped }))
  }

  function buyItem(item: ShopItem) {
    if (!can_buy_shop_items) return
    const qty = getQuantity(item)
    const total = +(item.coin_cost * qty).toFixed(2)
    if (total > balance.balance) return
    if (!confirm(`Spend ${total}c on ${qty}× ${item.name}?`)) return
    router.post('/shop/orders', { kind: 'shop_item', shop_item_id: item.id, quantity: qty })
  }

  return (
    <>
      <Head title="Shop — Forge" />
      <div className="p-12 max-w-6xl mx-auto space-y-8">
        <section className="flex items-end justify-between gap-6 flex-wrap">
          <div>
            <h1 className="text-5xl font-headline font-bold tracking-tight text-[#e5e2e1] mb-2">Shop</h1>
            <p className="text-stone-500">Spend your steel coins on hardware.</p>
          </div>
          <div className="bg-[#1c1b1b] ghost-border px-6 py-4 flex items-center gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">Balance</p>
              <p className="text-3xl font-headline font-bold text-[#ee671c]">{balance.balance}c</p>
            </div>
            <div className="text-stone-600 text-xs">
              <p>Earned {balance.earned}c</p>
              <p>Spent {balance.spent}c</p>
            </div>
          </div>
        </section>

        <section className="bg-[#1c1b1b] ghost-border p-5 flex items-center justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <p className="font-headline font-bold text-[#e5e2e1]">Direct project grant</p>
            <p className="text-stone-500 text-xs">Trade {direct_grant_ratio}c per $1 to fund hardware for one of your approved projects.</p>
          </div>
          <button
            onClick={() => setShowDirectForm((v) => !v)}
            className="signature-smolder text-[#4c1a00] px-5 py-2 text-xs font-bold uppercase tracking-[0.15em] cursor-pointer flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-base">redeem</span>
            {showDirectForm ? 'Cancel' : 'Redeem'}
          </button>
        </section>

        {showDirectForm && (
          <form onSubmit={placeDirect} className="bg-[#1c1b1b] ghost-border p-6 space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500 mb-2">Project</label>
              {eligible_projects.length === 0 ? (
                <p className="text-stone-500 text-xs">You need an approved project to redeem a direct grant.</p>
              ) : (
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full bg-[#0e0e0e] border-none px-4 py-3 text-[#e5e2e1] text-sm focus:ring-1 focus:ring-[#ee671c]/30"
                >
                  {eligible_projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500 mb-2">Amount (USD)</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="50.00"
                  className="w-full bg-[#0e0e0e] border-none px-4 py-3 text-[#e5e2e1] text-sm focus:ring-1 focus:ring-[#ee671c]/30 placeholder:text-stone-600"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500 mb-2">Cost</label>
                <p className="text-2xl font-headline font-bold text-[#e5e2e1] py-3">{directCost}c</p>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500 mb-2">Notes for staff (optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Anything staff should know..."
                className="w-full bg-[#0e0e0e] border-none px-4 py-3 text-[#e5e2e1] text-sm focus:ring-1 focus:ring-[#ee671c]/30 placeholder:text-stone-600 resize-y"
              />
            </div>
            <button
              type="submit"
              disabled={!canAffordDirect}
              className="signature-smolder text-[#4c1a00] px-6 py-3 font-bold uppercase tracking-wider text-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Place Order
            </button>
          </form>
        )}

        {!can_buy_shop_items && (
          <div className="bg-amber-500/10 border border-amber-500/20 p-4 text-amber-200 text-sm flex items-start gap-3">
            <span className="material-symbols-outlined text-base shrink-0">lock</span>
            <p>Shop items unlock once you've marked at least one project as built.</p>
          </div>
        )}

        <section>
          {shop_items.length === 0 ? (
            <div className="bg-[#1c1b1b] ghost-border p-12 text-center">
              <p className="text-stone-500 text-sm">No items in the shop yet. Check back soon.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {shop_items.map((item) => {
                const qty = getQuantity(item)
                const totalCost = +(item.coin_cost * qty).toFixed(2)
                const affordable = totalCost <= balance.balance
                const enabled = can_buy_shop_items && affordable
                const max = item.max_quantity ?? 999
                const showQuantity = max > 1
                return (
                  <div key={item.id} className="bg-[#1c1b1b] ghost-border flex flex-col min-w-0 overflow-hidden">
                    <div className="aspect-square bg-[#0e0e0e] flex items-center justify-center">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-5xl">📦</span>
                      )}
                    </div>
                    <div className="p-4 flex-1 flex flex-col">
                      <h3 className="font-headline font-bold text-[#e5e2e1] tracking-tight mb-1 break-words text-sm">{item.name}</h3>
                      {item.description && (
                        <p className="text-stone-400 text-sm leading-relaxed mb-3 line-clamp-4 break-words">{item.description}</p>
                      )}
                      <div className="mt-auto space-y-2">
                        <p className="text-[#ee671c] font-headline font-bold text-sm">
                          {item.coin_cost}c{qty > 1 ? ` × ${qty} = ${totalCost}c` : ''}
                        </p>
                        {showQuantity && (
                          <div className="flex items-center justify-between bg-[#0e0e0e] ghost-border px-2 py-1">
                            <button
                              type="button"
                              onClick={() => setQuantity(item, qty - 1)}
                              disabled={qty <= 1}
                              className="text-stone-400 hover:text-[#ffb595] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer w-6 text-center"
                            >
                              −
                            </button>
                            <input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              value={qty}
                              onChange={(e) => setQuantity(item, parseInt(e.target.value.replace(/\D/g, '')) || 1)}
                              className="bg-transparent border-none text-center text-[#e5e2e1] text-sm w-12 focus:outline-none focus:ring-0 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                            />
                            <button
                              type="button"
                              onClick={() => setQuantity(item, qty + 1)}
                              disabled={qty >= max}
                              className="text-stone-400 hover:text-[#ffb595] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer w-6 text-center"
                            >
                              +
                            </button>
                          </div>
                        )}
                        {item.max_quantity != null && (
                          <p className="text-stone-600 text-[9px] uppercase tracking-wider text-center">Max {item.max_quantity} per order</p>
                        )}
                        <button
                          onClick={() => buyItem(item)}
                          disabled={!enabled}
                          className={`w-full py-2 text-[10px] font-bold uppercase tracking-[0.15em] transition-colors ${enabled ? 'signature-smolder text-[#4c1a00] cursor-pointer' : 'bg-stone-700/40 text-stone-500 cursor-not-allowed'}`}
                        >
                          {!can_buy_shop_items ? 'Locked' : affordable ? 'Buy' : "Can't afford"}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        <section>
          <div className="flex gap-6 flex-wrap">
            <button
              onClick={() => setShowOrders((v) => !v)}
              className="text-stone-500 hover:text-[#e5e2e1] text-xs font-bold uppercase tracking-[0.2em] flex items-center gap-1 transition-colors cursor-pointer"
            >
              {showOrders ? 'Hide' : 'Show'} order history ({orders.length})
              <span className="material-symbols-outlined text-sm">{showOrders ? 'expand_less' : 'expand_more'}</span>
            </button>
            <button
              onClick={() => setShowTransactions((v) => !v)}
              className="text-stone-500 hover:text-[#e5e2e1] text-xs font-bold uppercase tracking-[0.2em] flex items-center gap-1 transition-colors cursor-pointer"
            >
              {showTransactions ? 'Hide' : 'Show'} coin history ({transactions.length})
              <span className="material-symbols-outlined text-sm">{showTransactions ? 'expand_less' : 'expand_more'}</span>
            </button>
          </div>

          {showTransactions && (
            <div className="mt-4 space-y-1.5">
              {transactions.length === 0 ? (
                <p className="text-stone-500 text-sm">No coin activity yet.</p>
              ) : (
                transactions.map((tx, idx) => (
                  <div key={idx} className="bg-[#1c1b1b] ghost-border px-4 py-3 flex items-center justify-between gap-4 min-w-0">
                    <div className="min-w-0 flex-1">
                      <p className="text-[#e5e2e1] text-sm break-words">{tx.label}</p>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-stone-600 mt-0.5">{tx.date}</p>
                    </div>
                    {tx.amount !== 0 && (
                      <span className={`text-base font-headline font-bold shrink-0 ${tx.amount >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {tx.amount >= 0 ? '+' : ''}{tx.amount}c
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {showOrders && (
            <div className="mt-4 space-y-2">
              {orders.length === 0 ? (
                <p className="text-stone-500 text-sm">No orders yet.</p>
              ) : (
                orders.map((order) => (
                  <div key={order.id} className="bg-[#1c1b1b] ghost-border p-4 min-w-0 overflow-hidden flex gap-3 items-center">
                    {order.shop_item_image && (
                      <img src={order.shop_item_image} alt="" className="w-12 h-12 object-cover shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <p className="text-[#e5e2e1] text-sm font-headline font-bold break-words">
                          {order.quantity > 1 ? `${order.quantity}× ` : ''}{order.kind_label}
                        </p>
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 ${STATUS_STYLES[order.status]}`}>
                          {order.status}
                        </span>
                      </div>
                      {order.project_name && (
                        <p className="text-stone-500 text-xs">For {order.project_name}</p>
                      )}
                      <div className="flex items-center justify-between gap-4 mt-1 text-xs flex-wrap">
                        <div className="text-stone-500">
                          <span className="text-[#ee671c] font-bold">{order.coin_cost}c</span>
                          {order.amount_usd != null && <span className="text-stone-600 ml-2">${order.amount_usd}</span>}
                        </div>
                        <span className="text-stone-600">{order.created_at}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </section>
      </div>
    </>
  )
}
