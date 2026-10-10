import { useState, type FormEvent } from 'react'
import { Head, Link, router } from '@inertiajs/react'
import { AlertTriangle, ExternalLink, Merge, Search } from 'lucide-react'
import { Badge } from '@/components/admin/ui/badge'
import { Button } from '@/components/admin/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/admin/ui/card'
import { Input } from '@/components/admin/ui/input'
import { cn } from '@/components/admin/lib/cn'

interface GrantOrder {
  id: number
  kind_label: string
  project_name: string | null
  amount_usd: number | null
  fulfilled_at: string | null
}

interface Grant {
  hcb_id: string | null
  hcb_grant_link: string
  status: string | null
  amount_usd: number | null
  balance_usd: number | null
  hcb_error: string | null
  orders: GrantOrder[]
}

interface GrantUser {
  id: number
  display_name: string
  avatar: string
  email: string
  slack_id: string
}

function statusBadge(grant: Grant) {
  if (!grant.hcb_id) return <Badge variant="outline">Unrecognised link</Badge>
  if (grant.hcb_error) return <Badge variant="destructive">HCB error</Badge>
  switch (grant.status) {
    case 'active':
      return <Badge variant="success">Active</Badge>
    case 'canceled':
      return <Badge variant="destructive">Cancelled</Badge>
    case 'expired':
      return <Badge variant="warning">Expired</Badge>
    default:
      return <Badge variant="outline">Unknown</Badge>
  }
}

export default function AdminGrantMergesIndex({
  query,
  user,
  grants,
  not_found,
  hcb_connected,
}: {
  query: string
  user: GrantUser | null
  grants: Grant[]
  not_found: boolean
  hcb_connected: boolean
}) {
  const [search, setSearch] = useState(query)
  const [selected, setSelected] = useState<string[]>([])
  const [merging, setMerging] = useState(false)

  function lookup(e: FormEvent) {
    e.preventDefault()
    router.get('/admin/grant_merges', { query: search.trim() || undefined }, { preserveState: true })
  }

  function toggle(hcbId: string) {
    setSelected((prev) =>
      prev.includes(hcbId) ? prev.filter((id) => id !== hcbId) : prev.length < 2 ? [...prev, hcbId] : prev,
    )
  }

  const selectedGrants = grants.filter((g) => g.hcb_id && selected.includes(g.hcb_id))
  const mergedTotal = selectedGrants.reduce((sum, g) => sum + (g.balance_usd ?? 0), 0)
  const canMerge = hcb_connected && user != null && selectedGrants.length === 2 && mergedTotal > 0

  function merge() {
    if (!user || !canMerge) return
    if (
      !confirm(
        `Cancel these two HCB grants and issue a single $${mergedTotal.toFixed(2)} grant to ${user.email}? This moves real money and can't be undone.`,
      )
    )
      return
    router.post(
      '/admin/grant_merges',
      { user_id: user.id, grant_ids: selected, query },
      {
        onStart: () => setMerging(true),
        onFinish: () => setMerging(false),
        onSuccess: () => setSelected([]),
      },
    )
  }

  return (
    <>
      <Head title="Grant Merger - Admin" />
      <div className="max-w-4xl mx-auto space-y-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Grant Merger</h1>
          <p className="text-sm text-muted-foreground">
            Cancel two of a builder's HCB grants and issue one grant for their combined remaining balance.
          </p>
        </div>

        {!hcb_connected && (
          <Card className="border-amber-500/40 bg-amber-500/5">
            <CardContent className="p-3 flex items-start gap-2 text-sm">
              <AlertTriangle className="size-4 shrink-0 mt-0.5" />
              <p>Connect HCB under Admin → API Keys before merging grants.</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-4">
            <form onSubmit={lookup} className="flex gap-2">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Email or Slack ID"
                autoFocus
              />
              <Button type="submit">
                <Search className="size-4" />
                Find
              </Button>
            </form>
            {not_found && <p className="text-sm text-amber-600 mt-2">No user matches “{query}”.</p>}
          </CardContent>
        </Card>

        {user && (
          <Card>
            <CardHeader>
              <CardTitle>Builder</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <Link href={`/admin/users/${user.id}`} className="flex items-center gap-3 hover:underline">
                <img src={user.avatar} alt={user.display_name} className="size-10 rounded-full border border-border" />
                <span className="font-medium">{user.display_name}</span>
              </Link>
              <p className="text-sm text-muted-foreground">
                HCB email: <span className="font-mono">{user.email}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Slack: <span className="font-mono">{user.slack_id}</span>
              </p>
            </CardContent>
          </Card>
        )}

        {user && (
          <Card>
            <CardHeader>
              <CardTitle>
                {grants.length} grant{grants.length === 1 ? '' : 's'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {grants.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">
                  {user.display_name} has no fulfilled orders with an HCB grant link.
                </p>
              ) : (
                grants.map((grant) => {
                  const selectable = hcb_connected && grant.hcb_id != null && grant.status === 'active'
                  const isSelected = grant.hcb_id != null && selected.includes(grant.hcb_id)
                  return (
                    <label
                      key={grant.hcb_grant_link}
                      className={cn(
                        'flex items-start gap-3 rounded-md border p-3 transition-colors',
                        selectable ? 'cursor-pointer hover:bg-accent' : 'opacity-60',
                        isSelected ? 'border-primary bg-primary/5' : 'border-border',
                      )}
                    >
                      <input
                        type="checkbox"
                        className="mt-1"
                        disabled={!selectable || (!isSelected && selected.length >= 2)}
                        checked={isSelected}
                        onChange={() => grant.hcb_id && toggle(grant.hcb_id)}
                      />
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {statusBadge(grant)}
                          <a
                            href={grant.hcb_grant_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-mono hover:underline inline-flex items-center gap-1 break-all"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {grant.hcb_grant_link}
                            <ExternalLink className="size-3 shrink-0" />
                          </a>
                        </div>
                        {grant.hcb_error ? (
                          <p className="text-xs text-destructive">{grant.hcb_error}</p>
                        ) : grant.balance_usd != null ? (
                          <p className="text-sm">
                            <strong>${grant.balance_usd.toFixed(2)}</strong> remaining of $
                            {(grant.amount_usd ?? 0).toFixed(2)}
                          </p>
                        ) : null}
                        <ul className="text-xs text-muted-foreground space-y-0.5">
                          {grant.orders.map((o) => (
                            <li key={o.id}>
                              <Link href={`/admin/orders/${o.id}`} className="hover:underline text-foreground">
                                Order #{o.id}
                              </Link>{' '}
                              · {o.kind_label}
                              {o.project_name ? ` · ${o.project_name}` : ''}
                              {o.amount_usd != null ? ` · $${o.amount_usd}` : ''}
                              {o.fulfilled_at ? ` · ${o.fulfilled_at}` : ''}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </label>
                  )
                })
              )}
            </CardContent>
          </Card>
        )}

        {user && grants.length > 1 && (
          <Card className={cn(canMerge && 'border-primary/40 bg-primary/5')}>
            <CardContent className="p-4 flex items-center justify-between gap-3 flex-wrap">
              <p className="text-sm">
                {selectedGrants.length === 2 ? (
                  <>
                    Cancel both selected grants and issue one <strong>${mergedTotal.toFixed(2)}</strong> grant to{' '}
                    <span className="font-mono">{user.email}</span>.
                  </>
                ) : (
                  'Select two active grants to merge.'
                )}
              </p>
              <Button onClick={merge} disabled={!canMerge || merging}>
                <Merge className="size-4" />
                {merging ? 'Merging…' : 'Merge grants'}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  )
}
