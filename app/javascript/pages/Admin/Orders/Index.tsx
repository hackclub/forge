import { useState } from 'react'
import { Head, Link, router } from '@inertiajs/react'
import { User, AlertTriangle, Search } from 'lucide-react'
import { Badge } from '@/components/admin/ui/badge'
import { Button } from '@/components/admin/ui/button'
import { Card, CardContent } from '@/components/admin/ui/card'
import { Input } from '@/components/admin/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/admin/ui/table'
import AdminPagination from '@/components/admin/AdminPagination'
import { cn } from '@/components/admin/lib/cn'
import type { PagyProps } from '@/types'

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
  filters: {
    status: string
    kind: string
    region: string
    assigned_to: string
    shop_item_id: string
    search: string
  }
  counts: { all: number; pending: number; approved: number; fulfilled: number; rejected: number }
  regions: Record<string, string>
  fulfillment_users: { id: number; display_name: string }[]
  shop_items: { id: number; name: string }[]
}

function statusBadge(status: OrderRow['status']) {
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

export default function AdminOrdersIndex({ orders, pagy, filters, counts, regions, shop_items }: Props) {
  const [searchQuery, setSearchQuery] = useState(filters.search)

  function applyFilter(key: string, value: string) {
    router.get('/admin/orders', { ...filters, [key]: value }, { preserveState: true })
  }

  function submitSearch(e: React.FormEvent) {
    e.preventDefault()
    applyFilter('search', searchQuery)
  }

  return (
    <>
      <Head title="Orders - Admin" />
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
          <p className="text-sm text-muted-foreground mt-1">Steel coin orders awaiting review and fulfillment.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {(['all', 'pending', 'approved', 'fulfilled', 'rejected'] as const).map((key) => {
            const active = key === 'all' ? !filters.status : filters.status === key
            return (
              <button
                key={key}
                onClick={() => applyFilter('status', key === 'all' ? '' : key)}
                className={cn(
                  'rounded-md border border-border p-4 text-left transition-colors cursor-pointer',
                  active ? 'bg-accent' : 'bg-card hover:bg-accent',
                )}
              >
                <p className="text-2xl font-semibold">{counts[key]}</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">{key}</p>
              </button>
            )
          })}
        </div>

        <div className="flex gap-2 flex-wrap items-center">
          <Button
            size="sm"
            variant={filters.assigned_to === 'me' ? 'default' : 'outline'}
            onClick={() => applyFilter('assigned_to', filters.assigned_to === 'me' ? '' : 'me')}
          >
            <User className="size-4" />
            My Orders
          </Button>
          <select
            value={filters.region}
            onChange={(e) => applyFilter('region', e.target.value)}
            className="h-9 rounded-md border border-border bg-background px-3 text-sm cursor-pointer"
          >
            <option value="">All Regions</option>
            {Object.entries(regions).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>

          <select
            value={filters.shop_item_id}
            onChange={(e) => applyFilter('shop_item_id', e.target.value)}
            className="h-9 rounded-md border border-border bg-background px-3 text-sm cursor-pointer"
          >
            <option value="">All Shop Items</option>
            {shop_items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>

          <form onSubmit={submitSearch} className="flex gap-2 items-center ml-auto">
            <div className="relative">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by user or HCB grant link…"
                className="pl-9 w-72"
              />
            </div>
            <Button type="submit" variant="outline" size="sm">
              Search
            </Button>
          </form>
        </div>

        {orders.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center text-sm text-muted-foreground">
              No orders match these filters.
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Region</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow
                      key={order.id}
                      className="cursor-pointer"
                      onClick={() => router.visit(`/admin/orders/${order.id}`)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3 min-w-0">
                          {order.shop_item_image && (
                            <img
                              src={order.shop_item_image}
                              alt=""
                              className="size-10 object-cover rounded-md border border-border shrink-0"
                            />
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Link
                                href={`/admin/orders/${order.id}`}
                                className="font-medium hover:underline text-sm"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {order.quantity > 1 ? `${order.quantity}× ` : ''}
                                {order.kind_label}
                              </Link>
                              {order.needs_attention && (
                                <Badge variant="warning" className="text-[10px]">
                                  <AlertTriangle className="size-3" />
                                  Check funding
                                </Badge>
                              )}
                            </div>
                            {order.project_name && (
                              <p className="text-xs text-muted-foreground mt-0.5">{order.project_name}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{order.user_display_name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {order.region ? regions[order.region] || order.region : '—'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{order.assigned_to_name || '—'}</TableCell>
                      <TableCell className="text-sm">
                        <span className="font-mono font-medium">{order.coin_cost}c</span>
                        {order.amount_usd != null && (
                          <span className="text-muted-foreground ml-2">${order.amount_usd}</span>
                        )}
                      </TableCell>
                      <TableCell>{statusBadge(order.status)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{order.created_at}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {pagy && pagy.pages > 1 && <AdminPagination pagy={pagy} />}
            </CardContent>
          </Card>
        )}
      </div>
    </>
  )
}
