import { Link, router } from '@inertiajs/react'
import { Clock, CheckCircle2, XCircle, AlertTriangle, ArrowRight, type LucideIcon } from 'lucide-react'
import { Badge } from '@/components/admin/ui/badge'
import { Card, CardContent } from '@/components/admin/ui/card'
import AdminPagination from '@/components/admin/AdminPagination'
import { cn } from '@/components/admin/lib/cn'
import type { PagyProps } from '@/types'

type Status = 'pending' | 'sent' | 'cancelled' | 'failed'

interface QueueItem {
  id: number
  status: Status
  table_name: string
  forge_id: string
  project_id: number | null
  project_name: string | null
  project_status: string | null
  project_inconsistent: boolean
  enqueued_by: string | null
  sent_by: string | null
  sent_at: string | null
  airtable_record_id: string | null
  error: string | null
  created_at: string
}

const statusInfo: Record<Status, { variant: 'default' | 'secondary' | 'outline' | 'destructive' | 'success' | 'warning'; icon: LucideIcon; label: string }> = {
  pending: { variant: 'warning', icon: Clock, label: 'Pending' },
  sent: { variant: 'success', icon: CheckCircle2, label: 'Sent' },
  cancelled: { variant: 'secondary', icon: XCircle, label: 'Cancelled' },
  failed: { variant: 'destructive', icon: AlertTriangle, label: 'Failed' },
}

export default function AdminAirtableQueueIndex({
  items,
  pagy,
  filters,
  counts,
  airtable_enabled,
}: {
  items: QueueItem[]
  pagy: PagyProps
  filters: { status: string }
  counts: { pending: number; sent: number; failed: number; cancelled: number }
  airtable_enabled: boolean
}) {
  function applyFilter(value: string) {
    router.get('/admin/airtable_queue', { status_filter: value }, { preserveState: true })
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Airtable Queue</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Staging area for Airtable projects. Review the submission before sending it off.
        </p>
      </div>

      {!airtable_enabled && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="p-3 text-sm text-destructive">
            Airtable is not configured. Items can be enqueued but not sent.
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(['pending', 'sent', 'failed', 'cancelled'] as Status[]).map((s) => (
          <Card key={s} className={filters.status === s ? 'ring-2 ring-ring' : ''}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{statusInfo[s].label}</p>
              <p className="text-2xl font-semibold">{counts[s]}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => applyFilter('')}
          className={cn(
            'px-3 py-1.5 text-xs font-medium rounded-md border transition-colors cursor-pointer',
            filters.status === ''
              ? 'bg-primary text-primary-foreground border-primary'
              : 'border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground',
          )}
        >
          All
        </button>
        {(['pending', 'sent', 'failed', 'cancelled'] as Status[]).map((s) => (
          <button
            key={s}
            onClick={() => applyFilter(s)}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded-md border transition-colors cursor-pointer',
              filters.status === s
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground',
            )}
          >
            {statusInfo[s].label}
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-base font-medium mb-1">Queue is empty</p>
            <p className="text-sm text-muted-foreground">Airtable-bound records will appear here for review before sending.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {items.map((item) => {
            const info = statusInfo[item.status]
            const Icon = info.icon
            return (
              <Link key={item.id} href={`/admin/airtable_queue/${item.id}`} className="block group">
                <Card className="group-hover:bg-accent transition-colors">
                  <CardContent className="p-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Badge variant={info.variant}>
                        <Icon className="size-3" />
                        {info.label}
                      </Badge>
                      {item.project_inconsistent && (
                        <Badge variant="warning" title="Project approved but no active Airtable record">
                          <AlertTriangle className="size-3" />
                          Out of sync
                        </Badge>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm truncate">{item.project_name || `Forge #${item.forge_id}`}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          <span className="font-mono">{item.table_name}</span> · enqueued by{' '}
                          {item.enqueued_by || 'system'}
                          {item.sent_by && ` · sent by ${item.sent_by}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-muted-foreground">{item.created_at}</span>
                      <ArrowRight className="size-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
          {pagy && pagy.pages > 1 && <AdminPagination pagy={pagy} />}
        </div>
      )}
    </div>
  )
}
