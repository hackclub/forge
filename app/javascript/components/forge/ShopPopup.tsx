import { useState } from 'react'
import { router } from '@inertiajs/react'
import { ForgeLoading, useForgeData } from './useForgeData'

interface Balance {
  balance: number
  earned: number
  spent: number
}

interface EligibleProject {
  id: number
  name: string
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
  type: string
  amount: number
  label: string
}

interface ShopData {
  balance: Balance
  streak_freezes: { owned: number; cost: number }
  can_buy_shop_items: boolean
  eligible_projects: EligibleProject[]
  shop_items: ShopItem[]
  orders: Order[]
  transactions: Transaction[]
  direct_grant_ratio: number
  regions: Record<string, string>
  user_region: string
}

const STATUS_STYLES: Record<Order['status'], string> = {
  pending: 'bg-amber-500/15 text-amber-400',
  approved: 'bg-emerald-500/15 text-emerald-400',
  fulfilled: 'bg-emerald-500/25 text-emerald-300',
  rejected: 'bg-red-500/15 text-red-400',
}

function reloadShop() {
  router.reload({ only: ['shop'] })
}

const MUTATE = { preserveScroll: true, preserveState: true, onSuccess: reloadShop } as const

export default function ShopPopup() {
  const { data } = useForgeData<ShopData>('shop')
  const [showDirectForm, setShowDirectForm] = useState(false)
  const [showOrders, setShowOrders] = useState(false)
  const [showTransactions, setShowTransactions] = useState(false)
  const [projectId, setProjectId] = useState('')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [quantities, setQuantities] = useState<Record<number, number>>({})

  if (!data) return <ForgeLoading />

  const {
    balance,
    streak_freezes,
    can_buy_shop_items,
    eligible_projects,
    shop_items,
    orders,
    transactions,
    direct_grant_ratio,
    regions,
    user_region,
  } = data

  const activeProjectId = projectId || String(eligible_projects[0]?.id || '')
  const numericAmount = parseFloat(amount) || 0
  const directCost = +(numericAmount * direct_grant_ratio).toFixed(2)
  const canAffordDirect = directCost > 0 && directCost <= balance.balance && !!activeProjectId

  function getQuantity(item: ShopItem) {
    return quantities[item.id] ?? 1
  }
  function setQuantity(item: ShopItem, qty: number) {
    const max = item.max_quantity ?? 999
    setQuantities((prev) => ({ ...prev, [item.id]: Math.max(1, Math.min(qty, max)) }))
  }

  function placeDirect(e: React.FormEvent) {
    e.preventDefault()
    if (!canAffordDirect) return
    router.post(
      '/shop/orders',
      { kind: 'direct_grant', project_id: activeProjectId, amount_usd: numericAmount, description: description.trim() },
      {
        ...MUTATE,
        onSuccess: () => {
          setAmount('')
          setDescription('')
          setShowDirectForm(false)
          reloadShop()
        },
      },
    )
  }

  function buyStreakFreeze() {
    if (streak_freezes.cost > balance.balance) return
    if (!confirm(`Spend ${streak_freezes.cost}c on a streak freeze?`)) return
    router.post('/shop/orders', { kind: 'streak_freeze', quantity: 1 }, MUTATE)
  }

  function buyItem(item: ShopItem) {
    if (!can_buy_shop_items) return
    const qty = getQuantity(item)
    const total = +(item.coin_cost * qty).toFixed(2)
    if (total > balance.balance) return
    if (!confirm(`Spend ${total}c on ${qty}× ${item.name}?`)) return
    router.post('/shop/orders', { kind: 'shop_item', shop_item_id: item.id, quantity: qty }, MUTATE)
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-stone-400">Spend your steel coins on hardware.</p>
        <div className="flex items-center gap-4 bg-[#0e0e0e] px-5 py-3 ghost-border">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">Balance</p>
            <p className="font-headline text-2xl font-bold text-[#ca5924]">{balance.balance}c</p>
          </div>
          <div className="text-xs text-stone-600">
            <p>Earned {balance.earned}c</p>
            <p>Spent {balance.spent}c</p>
          </div>
        </div>
      </section>

      <section className="flex flex-wrap items-center justify-between gap-4 bg-[#0e0e0e] p-4 ghost-border">
        <div className="min-w-0">
          <p className="font-headline font-bold text-[#e5e2e1]">Your region</p>
          <p className="text-xs text-stone-500">Prices and availability vary by region.</p>
        </div>
        <select
          value={user_region}
          onChange={(e) => router.patch('/shop/region', { region: e.target.value }, MUTATE)}
          className="cursor-pointer bg-[#1c1b1b] px-4 py-2.5 text-sm text-[#e5e2e1] ghost-border focus:outline-none focus:ring-1 focus:ring-[#ca5924]/30"
        >
          {Object.entries(regions).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </section>

      <section className="flex flex-wrap items-center justify-between gap-4 bg-[#0e0e0e] p-4 ghost-border">
        <div className="min-w-0">
          <p className="flex items-center gap-2 font-headline font-bold text-[#e5e2e1]">
            <span className="material-symbols-outlined text-base text-[#ffb595]">ac_unit</span>
            Streak freeze
          </p>
          <p className="text-xs text-stone-500">
            Covers one missed day so your streak survives. You own{' '}
            <span className="font-bold text-[#e5e2e1]">{streak_freezes.owned}</span>.
          </p>
        </div>
        <button
          onClick={buyStreakFreeze}
          disabled={streak_freezes.cost > balance.balance}
          className="signature-smolder flex cursor-pointer items-center gap-2 px-5 py-2 text-xs font-bold uppercase tracking-[0.15em] text-[#4c1a00] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-base">shopping_cart</span>
          Buy for {streak_freezes.cost}c
        </button>
      </section>

      <section className="flex flex-wrap items-center justify-between gap-4 bg-[#0e0e0e] p-4 ghost-border">
        <div className="min-w-0">
          <p className="font-headline font-bold text-[#e5e2e1]">Direct project grant</p>
          <p className="text-xs text-stone-500">
            Trade {direct_grant_ratio}c per $1 to fund hardware for one of your approved projects.
          </p>
        </div>
        <button
          onClick={() => setShowDirectForm((v) => !v)}
          className="signature-smolder flex cursor-pointer items-center gap-2 px-5 py-2 text-xs font-bold uppercase tracking-[0.15em] text-[#4c1a00]"
        >
          <span className="material-symbols-outlined text-base">redeem</span>
          {showDirectForm ? 'Cancel' : 'Redeem'}
        </button>
      </section>

      {showDirectForm && (
        <form onSubmit={placeDirect} className="space-y-4 bg-[#0e0e0e] p-5 ghost-border">
          <div>
            <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">
              Project
            </label>
            {eligible_projects.length === 0 ? (
              <p className="text-xs text-stone-500">You need an approved project to redeem a direct grant.</p>
            ) : (
              <select
                value={activeProjectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full bg-[#1c1b1b] px-4 py-2.5 text-sm text-[#e5e2e1] ghost-border focus:outline-none focus:ring-1 focus:ring-[#ca5924]/30"
              >
                {eligible_projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">
                Amount (USD)
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="50.00"
                className="w-full bg-[#1c1b1b] px-4 py-2.5 text-sm text-[#e5e2e1] ghost-border placeholder:text-stone-600 focus:outline-none focus:ring-1 focus:ring-[#ca5924]/30"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">Cost</label>
              <p className="py-2 font-headline text-2xl font-bold text-[#e5e2e1]">{directCost}c</p>
            </div>
          </div>
          <button
            type="submit"
            disabled={!canAffordDirect}
            className="signature-smolder cursor-pointer px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-[#4c1a00] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Place Order
          </button>
        </form>
      )}

      {!can_buy_shop_items && (
        <div className="flex items-start gap-3 border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-200">
          <span className="material-symbols-outlined shrink-0 text-base">lock</span>
          <p>Shop items unlock once you've marked at least one project as built.</p>
        </div>
      )}

      <section>
        {shop_items.length === 0 ? (
          <div className="bg-[#0e0e0e] p-12 text-center ghost-border">
            <p className="text-sm text-stone-500">No items in the shop yet. Check back soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {shop_items.map((item) => {
              const qty = getQuantity(item)
              const totalCost = +(item.coin_cost * qty).toFixed(2)
              const affordable = totalCost <= balance.balance
              const enabled = can_buy_shop_items && affordable
              const max = item.max_quantity ?? 999
              return (
                <div key={item.id} className="flex min-w-0 flex-col overflow-hidden bg-[#0e0e0e] ghost-border">
                  <div className="flex aspect-square items-center justify-center bg-[#1c1b1b]">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-5xl">📦</span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-3">
                    <h3 className="mb-1 break-words font-headline text-sm font-bold tracking-tight text-[#e5e2e1]">
                      {item.name}
                    </h3>
                    <ItemDescription description={item.description} />
                    <div className="mt-auto space-y-2">
                      <p className="font-headline text-sm font-bold text-[#ca5924]">
                        {item.coin_cost}c{qty > 1 ? ` × ${qty} = ${totalCost}c` : ''}
                      </p>
                      {max > 1 && (
                        <div className="flex items-center justify-between bg-[#1c1b1b] px-2 py-1 ghost-border">
                          <button
                            type="button"
                            onClick={() => setQuantity(item, qty - 1)}
                            disabled={qty <= 1}
                            className="w-6 cursor-pointer text-center text-stone-400 hover:text-[#ffb595] disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            −
                          </button>
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={qty}
                            onChange={(e) => setQuantity(item, parseInt(e.target.value.replace(/\D/g, '')) || 1)}
                            className="w-12 border-none bg-transparent text-center text-sm text-[#e5e2e1] focus:outline-none focus:ring-0 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                          />
                          <button
                            type="button"
                            onClick={() => setQuantity(item, qty + 1)}
                            disabled={qty >= max}
                            className="w-6 cursor-pointer text-center text-stone-400 hover:text-[#ffb595] disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            +
                          </button>
                        </div>
                      )}
                      <button
                        onClick={() => buyItem(item)}
                        disabled={!enabled}
                        className={`w-full py-2 text-[10px] font-bold uppercase tracking-[0.15em] transition-colors ${enabled ? 'signature-smolder cursor-pointer text-[#4c1a00]' : 'cursor-not-allowed bg-stone-700/40 text-stone-500'}`}
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
        <div className="flex flex-wrap gap-6">
          <button
            onClick={() => setShowOrders((v) => !v)}
            className="flex cursor-pointer items-center gap-1 text-xs font-bold uppercase tracking-[0.2em] text-stone-500 transition-colors hover:text-[#e5e2e1]"
          >
            {showOrders ? 'Hide' : 'Show'} order history ({orders.length})
            <span className="material-symbols-outlined text-sm">{showOrders ? 'expand_less' : 'expand_more'}</span>
          </button>
          <button
            onClick={() => setShowTransactions((v) => !v)}
            className="flex cursor-pointer items-center gap-1 text-xs font-bold uppercase tracking-[0.2em] text-stone-500 transition-colors hover:text-[#e5e2e1]"
          >
            {showTransactions ? 'Hide' : 'Show'} coin history ({transactions.length})
            <span className="material-symbols-outlined text-sm">
              {showTransactions ? 'expand_less' : 'expand_more'}
            </span>
          </button>
        </div>

        {showTransactions && (
          <div className="mt-4 space-y-1.5">
            {transactions.length === 0 ? (
              <p className="text-sm text-stone-500">No coin activity yet.</p>
            ) : (
              transactions.map((tx, idx) => (
                <div
                  key={idx}
                  className="flex min-w-0 items-center justify-between gap-4 bg-[#0e0e0e] px-4 py-3 ghost-border"
                >
                  <div className="min-w-0 flex-1">
                    <p className="break-words text-sm text-[#e5e2e1]">{tx.label}</p>
                    <p className="mt-0.5 text-[10px] uppercase tracking-[0.2em] text-stone-600">{tx.date}</p>
                  </div>
                  {tx.amount !== 0 && (
                    <span
                      className={`shrink-0 font-headline text-base font-bold ${tx.amount >= 0 ? 'text-emerald-400' : 'text-red-400'}`}
                    >
                      {tx.amount >= 0 ? '+' : ''}
                      {tx.amount}c
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
              <p className="text-sm text-stone-500">No orders yet.</p>
            ) : (
              orders.map((order) => (
                <div
                  key={order.id}
                  className="flex min-w-0 items-center gap-3 overflow-hidden bg-[#0e0e0e] p-4 ghost-border"
                >
                  {order.shop_item_image && (
                    <img src={order.shop_item_image} alt="" className="h-12 w-12 shrink-0 object-cover" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="break-words font-headline text-sm font-bold text-[#e5e2e1]">
                        {order.quantity > 1 ? `${order.quantity}× ` : ''}
                        {order.kind_label}
                      </p>
                      <span
                        className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${STATUS_STYLES[order.status]}`}
                      >
                        {order.status}
                      </span>
                    </div>
                    {order.project_name && <p className="text-xs text-stone-500">For {order.project_name}</p>}
                    <div className="mt-1 flex flex-wrap items-center justify-between gap-4 text-xs">
                      <div className="text-stone-500">
                        <span className="font-bold text-[#ca5924]">{order.coin_cost}c</span>
                        {order.amount_usd != null && <span className="ml-2 text-stone-600">${order.amount_usd}</span>}
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
  )
}

function ItemDescription({ description }: { description: string | null }) {
  const [expanded, setExpanded] = useState(false)
  if (!description) return null

  return (
    <div className="mb-3">
      <p
        className={`whitespace-pre-line break-words text-sm leading-relaxed text-stone-400 ${expanded ? '' : 'line-clamp-3'}`}
      >
        {description}
      </p>
      <button
        onClick={() => setExpanded((v) => !v)}
        className="mt-1 cursor-pointer text-xs text-[#ffb595] hover:text-[#ca5924]"
      >
        {expanded ? 'Show less' : 'See more'}
      </button>
    </div>
  )
}
