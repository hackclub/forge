import { useState } from 'react'
import { Head, router } from '@inertiajs/react'
import { Plus, X, Trash2, Package } from 'lucide-react'
import { Badge } from '@/components/admin/ui/badge'
import { Button } from '@/components/admin/ui/button'
import { Card, CardContent } from '@/components/admin/ui/card'
import { Input } from '@/components/admin/ui/input'
import { Textarea } from '@/components/admin/ui/textarea'

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

const blank = {
  name: '',
  description: '',
  image_url: '',
  coin_cost: '',
  enabled: true,
  internal_order_link: '',
  internal_price_usd: '',
  max_quantity: '',
}

export default function AdminShopItemsIndex({
  items,
  regions,
}: {
  items: ShopItem[]
  regions: Record<string, string>
}) {
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
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">Shop Items</h1>
          <Button onClick={() => (showForm ? reset() : setShowForm(true))}>
            {showForm ? <X className="size-4" /> : <Plus className="size-4" />}
            {showForm ? 'Cancel' : 'New Item'}
          </Button>
        </div>

        {showForm && (
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={submit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Name</label>
                    <Input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                      placeholder="Solder"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Coin cost</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={form.coin_cost}
                      onChange={(e) => setForm({ ...form, coin_cost: e.target.value })}
                      required
                      placeholder="20"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Max purchase quantity</label>
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    value={form.max_quantity}
                    onChange={(e) => setForm({ ...form, max_quantity: e.target.value })}
                    placeholder="Leave blank for no cap"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Maximum a user can buy in a single order. Leave blank for unlimited.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Image URL</label>
                  <Input
                    type="url"
                    value={form.image_url}
                    onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Description</label>
                  <Textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="What is it?"
                  />
                </div>

                <div className="border-t border-border pt-4 space-y-3">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Internal (staff only)</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs text-muted-foreground">Order link</label>
                      <Input
                        type="url"
                        value={form.internal_order_link}
                        onChange={(e) => setForm({ ...form, internal_order_link: e.target.value })}
                        placeholder="https://amazon.com/..."
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-muted-foreground">Internal price (USD, incl. shipping)</label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={form.internal_price_usd}
                        onChange={(e) => setForm({ ...form, internal_price_usd: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-border pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Region Pricing</p>
                    {regionPricing.length === 0 && (
                      <Button type="button" variant="link" size="sm" onClick={() => setRegionPricing(defaultRegionPricing())}>
                        Set up regions
                      </Button>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Leave cost blank to use the default price above.
                  </p>
                  {regionPricing.length > 0 && (
                    <div className="space-y-2">
                      {regionPricing.map((rp, idx) => (
                        <div key={rp.region} className="grid grid-cols-[1fr_120px_auto] gap-3 items-center">
                          <span className="text-sm">{regions[rp.region]}</span>
                          <Input
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
                            className="h-8"
                          />
                          <label className="flex items-center gap-2 text-xs cursor-pointer">
                            <input
                              type="checkbox"
                              checked={rp.enabled}
                              onChange={(e) => {
                                const updated = [...regionPricing]
                                updated[idx] = { ...rp, enabled: e.target.checked }
                                setRegionPricing(updated)
                              }}
                            />
                            On
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.enabled}
                    onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
                  />
                  Enabled (global)
                </label>
                <div className="flex gap-2">
                  <Button type="submit">{editingId ? 'Save Changes' : 'Create'}</Button>
                  <Button type="button" variant="outline" onClick={reset}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {items.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center space-y-2">
              <Package className="size-12 text-muted-foreground mx-auto" />
              <p className="text-base font-medium">No shop items yet</p>
              <p className="text-sm text-muted-foreground">Add one to get the shop going.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => (
              <Card key={item.id} className={item.enabled ? '' : 'opacity-60'}>
                <div className="aspect-[4/3] bg-muted flex items-center justify-center overflow-hidden rounded-t-lg">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <Package className="size-12 text-muted-foreground" />
                  )}
                </div>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold break-words">{item.name}</h3>
                    {!item.enabled && <Badge variant="secondary">disabled</Badge>}
                  </div>
                  {item.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 break-words">{item.description}</p>
                  )}
                  <p className="font-semibold">{item.coin_cost}c</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => startEdit(item)}>
                      Edit
                    </Button>
                    <Button variant="destructive" size="icon" onClick={() => destroy(item.id, item.name)}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
