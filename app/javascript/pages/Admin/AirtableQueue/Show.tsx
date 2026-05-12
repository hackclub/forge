import { Link, router } from '@inertiajs/react'
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Undo2,
  Send,
  RefreshCw,
  Table as TableIcon,
  type LucideIcon,
} from 'lucide-react'
import { Badge } from '@/components/admin/ui/badge'
import { Button } from '@/components/admin/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/admin/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/admin/ui/table'

type Status = 'pending' | 'sent' | 'cancelled' | 'failed'

interface QueueItemDetail {
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
  payload: Record<string, unknown>
}

const statusInfo: Record<Status, { variant: 'default' | 'secondary' | 'outline' | 'destructive' | 'success' | 'warning'; icon: LucideIcon; label: string }> = {
  pending: { variant: 'warning', icon: Clock, label: 'Pending' },
  sent: { variant: 'success', icon: CheckCircle2, label: 'Sent' },
  cancelled: { variant: 'secondary', icon: XCircle, label: 'Cancelled' },
  failed: { variant: 'destructive', icon: AlertTriangle, label: 'Failed' },
}

function renderValue(value: unknown): string {
  if (value === null || value === undefined) return '-'
  if (Array.isArray(value)) return JSON.stringify(value, null, 2)
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (typeof value === 'object') return JSON.stringify(value, null, 2)
  return String(value)
}

export default function AdminAirtableQueueShow({
  item,
  airtable_enabled,
}: {
  item: QueueItemDetail
  airtable_enabled: boolean
}) {
  const info = statusInfo[item.status]
  const Icon = info.icon
  const fieldKeys = Object.keys(item.payload || {})

  function send() {
    if (
      !confirm(
        `Send this payload to Airtable table "${item.table_name}"? This will upsert the record via Forge Project ID = ${item.forge_id}.`,
      )
    )
      return
    router.post(`/admin/airtable_queue/${item.id}/send_to_airtable`)
  }

  function cancel() {
    if (!confirm('Cancel this queue item? It will not be sent.')) return
    router.post(`/admin/airtable_queue/${item.id}/cancel`)
  }

  function retry() {
    if (!confirm('Retry this item? A fresh queue entry will be created with the latest project data.')) return
    router.post(`/admin/airtable_queue/${item.id}/retry`)
  }

  function revertProject() {
    if (
      !confirm(
        'Revert the project approval to "returned"? Use this when the project was approved but no Airtable record exists.',
      )
    )
      return
    router.post(`/admin/airtable_queue/${item.id}/revert_project`)
  }

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/admin/airtable_queue">
          <ArrowLeft className="size-4" />
          Back to queue
        </Link>
      </Button>

      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Badge variant={info.variant}>
            <Icon className="size-3" />
            {info.label}
          </Badge>
          <span className="text-xs font-mono uppercase tracking-wide text-muted-foreground">{item.table_name}</span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight break-words">
          {item.project_name || `Forge #${item.forge_id}`}
        </h1>
        <p className="text-sm text-muted-foreground">
          Enqueued {item.created_at} by <span className="text-foreground">{item.enqueued_by || 'system'}</span>
          {item.sent_at && (
            <>
              {' '}
              · Sent {item.sent_at} by <span className="text-foreground">{item.sent_by}</span>
            </>
          )}
          {item.airtable_record_id && <span className="font-mono ml-2">· {item.airtable_record_id}</span>}
        </p>
      </div>

      {item.error && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="p-4">
            <p className="text-xs text-destructive uppercase tracking-wide font-semibold mb-2">Last error</p>
            <p className="text-sm font-mono break-words text-destructive">{item.error}</p>
          </CardContent>
        </Card>
      )}

      {item.project_inconsistent && (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardContent className="p-4 flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
            <div>
              <p className="text-xs text-amber-700 dark:text-amber-400 uppercase tracking-wide font-semibold mb-1">
                Inconsistent state
              </p>
              <p className="text-sm">
                Project is approved but has no pending or sent Airtable record. Revert the approval to keep things in sync.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={revertProject}>
              <Undo2 className="size-4" />
              Revert Approval
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {item.project_id && (
          <Card>
            <CardContent className="p-4">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Project</span>
              <p className="mt-1">
                <Link href={`/admin/projects/${item.project_id}`} className="hover:underline">
                  {item.project_name}
                </Link>
              </p>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardContent className="p-4">
            <span className="text-xs text-muted-foreground uppercase tracking-wide">Forge Project ID</span>
            <p className="mt-1 font-mono">{item.forge_id}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TableIcon className="size-4" />
            Airtable Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            Double-check every field below. This is exactly what will be upserted.
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-64">Field</TableHead>
                <TableHead>Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fieldKeys.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="text-muted-foreground italic">
                    Empty payload.
                  </TableCell>
                </TableRow>
              ) : (
                fieldKeys.map((k) => {
                  const v = item.payload[k]
                  const empty = v === null || v === undefined || v === ''
                  return (
                    <TableRow key={k} className="align-top">
                      <TableCell className="font-medium">{k}</TableCell>
                      <TableCell className={`font-mono text-xs whitespace-pre-wrap break-words ${empty ? 'text-muted-foreground italic' : ''}`}>
                        {empty ? '-' : renderValue(v)}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {item.status === 'pending' && (
        <Card>
          <CardContent className="p-4 flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold mb-1">Final check</h3>
              <p className="text-xs text-muted-foreground">
                Once sent, the record is upserted into Airtable by Forge Project ID.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={cancel}>
                <XCircle className="size-4" />
                Cancel
              </Button>
              <Button size="sm" onClick={send} disabled={!airtable_enabled}>
                <Send className="size-4" />
                Send to Airtable
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {item.status === 'failed' && (
        <Card>
          <CardContent className="p-4 flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold mb-1">Retry send</h3>
              <p className="text-xs text-muted-foreground">
                Re-queues a fresh entry with the latest project data. The original failed item stays in history.
              </p>
            </div>
            <Button size="sm" onClick={retry} disabled={!airtable_enabled || !item.project_id}>
              <RefreshCw className="size-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
