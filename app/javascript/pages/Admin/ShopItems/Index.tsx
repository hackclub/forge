import { useState } from 'react'
import { Head, router } from '@inertiajs/react'

interface RegionPricing {
  id: number | null
  region: string
  coin_cost: number
  enabled: boolean
}

interface ShopItem {
  id: number
  name: string
  description: string | null
  image_url: string | null
  coin_cost: number
  enabled: boolean
  internal_order_link: string | null
  internal_price_usd: number | null
  max_quantity: number | null
  region_pricing: RegionPricing[]
}

interface RegionPricingForm {
  id: number | null
  region: string
  coin_cost: string
  enabled: boolean
}

const blank = { name: '', description: '', image_url: '', coin_cost: '', enabled: true, internal_order_link: '', internal_price_usd: '', max_quantity: '' }

export default function AdminShopItemsIndex({ items, regions }: { items: ShopItem[]; regions: Record<string, string> }) {
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<typeof blank>(blank)
  const [regionPricing, setRegionPricing] = useState<RegionPricingForm[]>([])

  function defaultRegionPricing(): RegionPricingForm[] {
    return Object.keys(regions).map((r) => ({ id: null, region: r, coin_cost: '', enabled: true }))
  }

  function reset() {
    setForm(blank)
    setRegionPricing([])
    setEditingId(null)
    setShowForm(false)
  }

  function startEdit(item: ShopItem) {
    setEditingId(item.id)
    setForm({
      name: item.name,
      description: item.description || '',
      image_url: item.image_url || '',
      coin_cost: item.coin_cost.toString(),
      enabled: item.enabled,
      internal_order_link: item.internal_order_link || '',
      internal_price_usd: item.internal_price_usd?.toString() || '',
      max_quantity: item.max_quantity?.toString() || '',
    })
    const existing = Object.keys(regions).map((r) => {
      const found = item.region_pricing.find((rp) => rp.region === r)
      return found
        ? { id: found.id, region: r, coin_cost: found.coin_cost.toString(), enabled: found.enabled }
        : { id: null, region: r, coin_cost: '', enabled: true }
    })
    setRegionPricing(existing)
    setShowForm(true)
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const baseCost = parseFloat(form.coin_cost) || 0
    const attrs = regionPricing
      .filter((rp) => rp.coin_cost.trim() !== '' || !rp.enabled)
      .map((rp) => ({
        id: rp.id,
        region: rp.region,
        coin_cost: rp.coin_cost.trim() !== '' ? parseFloat(rp.coin_cost) || baseCost : baseCost,
        enabled: rp.enabled,
      }))
    const destroys = regionPricing
      .filter((rp) => rp.id && rp.coin_cost.trim() === '' && rp.enabled)
      .map((rp) => ({ id: rp.id, _destroy: true }))

    const payload = {
      shop_item: {
        ...form,
        coin_cost: parseFloat(form.coin_cost) || 0,
        internal_price_usd: form.internal_price_usd ? parseFloat(form.internal_price_usd) : null,
        max_quantity: form.max_quantity ? parseInt(form.max_quantity) : null,
        shop_item_regions_attributes: [...attrs, ...destroys],
      },
    }
    if (editingId) {
      router.patch(`/admin/shop_items/${editingId}`, payload, { onSuccess: reset })
    } else {
      router.post('/admin/shop_items', payload, { onSuccess: reset })
    }
  }

  function destroy(id: number, name: string) {
    if (!confirm(`Delete "${name}"?`)) return
    router.delete(`/admin/shop_items/${id}`)
  }

  return (
    <>
      <Head title="Shop Items - Admin" />
      <div className="p-5 md:p-12 max-w-[1400px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <h1 className="text-4xl font-headline font-bold text-[#e5e2e1] tracking-tight">Shop Items</h1>
          <button
            onClick={() => (showForm ? reset() : setShowForm(true))}
            className="signature-smolder text-[#4c1a00] px-6 py-3 font-bold uppercase tracking-wider text-xs flex items-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">{showForm ? 'close' : 'add'}</span>
            {showForm ? 'Cancel' : 'New Item'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={submit} className="ghost-border bg-[#1c1b1b] p-6 mb-8 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500 mb-2">Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="w-full bg-[#0e0e0e] border-none px-4 py-3 text-[#e5e2e1] text-sm focus:ring-1 focus:ring-[#ee671c]/30"
                  placeholder="Solder"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500 mb-2">Coin cost</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={form.coin_cost}
                  onChange={(e) => setForm({ ...form, coin_cost: e.target.value })}
                  required
                  className="w-full bg-[#0e0e0e] border-none px-4 py-3 text-[#e5e2e1] text-sm focus:ring-1 focus:ring-[#ee671c]/30"
                  placeholder="20"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500 mb-2">Max purchase quantity</label>
              <input
                type="number"
                min="1"
                step="1"
                value={form.max_quantity}
                onChange={(e) => setForm({ ...form, max_quantity: e.target.value })}
                className="w-full bg-[#0e0e0e] border-none px-4 py-3 text-[#e5e2e1] text-sm focus:ring-1 focus:ring-[#ee671c]/30"
                placeholder="Leave blank for no cap"
              />
              <p className="text-stone-600 text-[10px] mt-1">Maximum a user can buy in a single order. Leave blank for unlimited.</p>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500 mb-2">Image URL</label>
              <input
                type="url"
                value={form.image_url}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                className="w-full bg-[#0e0e0e] border-none px-4 py-3 text-[#e5e2e1] text-sm focus:ring-1 focus:ring-[#ee671c]/30"
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500 mb-2">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="w-full bg-[#0e0e0e] border-none px-4 py-3 text-[#e5e2e1] text-sm focus:ring-1 focus:ring-[#ee671c]/30 resize-y"
                placeholder="What is it?"
              />
            </div>

            <div className="border-t border-white/5 pt-4 space-y-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">Internal (staff only)</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500 mb-2">Order link</label>
                  <input
                    type="url"
                    value={form.internal_order_link}
                    onChange={(e) => setForm({ ...form, internal_order_link: e.target.value })}
                    placeholder="https://amazon.com/..."
                    className="w-full bg-[#0e0e0e] border-none px-4 py-3 text-[#e5e2e1] text-sm focus:ring-1 focus:ring-[#ee671c]/30"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500 mb-2">Internal price (USD, incl. shipping)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.internal_price_usd}
                    onChange={(e) => setForm({ ...form, internal_price_usd: e.target.value })}
                    placeholder="0.00"
                    className="w-full bg-[#0e0e0e] border-none px-4 py-3 text-[#e5e2e1] text-sm focus:ring-1 focus:ring-[#ee671c]/30"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-white/5 pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">Region Pricing</p>
                {regionPricing.length === 0 && (
                  <button type="button" onClick={() => setRegionPricing(defaultRegionPricing())} className="text-[#ffb595] text-xs hover:text-[#ee671c] cursor-pointer">
                    Set up regions
                  </button>
                )}
              </div>
              <p className="text-stone-600 text-[10px]">Leave cost blank to use the default price above. Clear a filled cost to remove that region's override.</p>
              {regionPricing.length > 0 && (
                <div className="space-y-2">
                  {regionPricing.map((rp, idx) => (
                    <div key={rp.region} className="grid grid-cols-[1fr_120px_auto] gap-3 items-center">
                      <span className="text-stone-300 text-sm">{regions[rp.region]}</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={rp.coin_cost}
                        onChange={(e) => {
                          const updated = [...regionPricing]
                          updated[idx] = { ...rp, coin_cost: e.target.value }
                          setRegionPricing(updated)
                        }}
                        placeholder={form.coin_cost || 'default'}
                        className="bg-[#0e0e0e] border-none px-3 py-2 text-[#e5e2e1] text-sm focus:ring-1 focus:ring-[#ee671c]/30"
                      />
                      <label className="flex items-center gap-2 text-xs text-stone-400 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={rp.enabled}
                          onChange={(e) => {
                            const updated = [...regionPricing]
                            updated[idx] = { ...rp, enabled: e.target.checked }
                            setRegionPricing(updated)
                          }}
                          className="accent-[#ee671c]"
                        />
                        On
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <label className="flex items-center gap-3 text-sm text-stone-400 cursor-pointer">
              <input
                type="checkbox"
                checked={form.enabled}
                onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
                className="accent-[#ee671c]"
              />
              Enabled (global)
            </label>
            <div className="flex gap-3">
              <button type="submit" className="signature-smolder text-[#4c1a00] px-6 py-3 font-bold uppercase tracking-wider text-xs cursor-pointer">
                {editingId ? 'Save Changes' : 'Create'}
              </button>
              <button type="button" onClick={reset} className="ghost-border text-stone-400 px-6 py-3 text-xs font-bold uppercase tracking-wider cursor-pointer">
                Cancel
              </button>
            </div>
          </form>
        )}

        {items.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.map((item) => (
              <div key={item.id} className={`bg-[#1c1b1b] ghost-border min-w-0 overflow-hidden ${item.enabled ? '' : 'opacity-50'}`}>
                <div className="aspect-[4/3] bg-[#0e0e0e] flex items-center justify-center">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-5xl">📦</span>
                  )}
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between mb-2 gap-2">
                    <h3 className="font-headline font-bold text-[#e5e2e1] tracking-tight break-words">{item.name}</h3>
                    {!item.enabled && (
                      <span className="text-[9px] font-bold uppercase tracking-wider bg-stone-500/15 text-stone-400 px-2 py-0.5">disabled</span>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-stone-500 text-xs mb-3 line-clamp-2 break-words">{item.description}</p>
                  )}
                  <p className="text-[#ee671c] font-headline font-bold text-sm mb-4">{item.coin_cost}c</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEdit(item)}
                      className="flex-1 ghost-border bg-[#0e0e0e] text-stone-400 hover:text-[#e5e2e1] py-2 text-xs font-bold uppercase tracking-wider cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => destroy(item.id, item.name)}
                      className="ghost-border bg-red-500/10 text-red-400 hover:bg-red-500/20 px-3 py-2 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="ghost-border bg-[#1c1b1b] p-16 text-center">
            <p className="text-stone-300 text-lg font-headline font-medium mb-2">No shop items yet</p>
            <p className="text-stone-500 text-sm">Add one to get the shop going.</p>
          </div>
        )}
      </div>
    </>
  )
}
