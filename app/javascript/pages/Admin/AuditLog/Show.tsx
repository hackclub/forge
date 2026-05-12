import { Link } from '@inertiajs/react'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/admin/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/admin/ui/card'

interface AuditEntryDetail {
  id: number
  action: string
  description: string
  actor_id: number | null
  actor_name: string
  target_type: string | null
  target_id: number | null
  target_label: string | null
  target_url: string | null
  metadata: Record<string, unknown>
  ip_address: string | null
  created_at: string
}

function renderValue(value: unknown): string {
  if (value === null || value === undefined) return '-'
  if (Array.isArray(value)) return value.length > 0 ? value.join(', ') : '-'
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function isChangeObject(value: unknown): value is Record<string, { from: unknown; to: unknown }> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const entries = Object.values(value as Record<string, unknown>)
  if (entries.length === 0) return false
  return entries.every(
    (v) => v !== null && typeof v === 'object' && !Array.isArray(v) && 'from' in (v as object) && 'to' in (v as object),
  )
}

function ChangesTable({ changes }: { changes: Record<string, { from: unknown; to: unknown }> }) {
  const keys = Object.keys(changes)
  if (keys.length === 0) return <span className="text-muted-foreground">-</span>
  return (
    <table className="w-full text-xs">
      <thead>
        <tr className="text-left text-muted-foreground">
          <th className="py-1 pr-3 font-medium uppercase tracking-wide">Field</th>
          <th className="py-1 pr-3 font-medium uppercase tracking-wide">Before</th>
          <th className="py-1 font-medium uppercase tracking-wide">After</th>
        </tr>
      </thead>
      <tbody>
        {keys.map((k) => (
          <tr key={k} className="border-t border-border align-top">
            <td className="py-1 pr-3 font-medium">{k}</td>
            <td className="py-1 pr-3 text-red-600 dark:text-red-300 break-words">{renderValue(changes[k].from)}</td>
            <td className="py-1 text-emerald-600 dark:text-emerald-300 break-words">{renderValue(changes[k].to)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function QueryResultTable({ columns, rows }: { columns: string[]; rows: unknown[][] }) {
  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <table className="w-full text-xs">
        <thead className="bg-muted">
          <tr className="text-left text-muted-foreground">
            {columns.map((c) => (
              <th key={c} className="px-3 py-2 font-medium uppercase tracking-wide">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-border">
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-2 font-mono break-words">
                  {renderValue(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function AdminAuditLogShow({ entry }: { entry: AuditEntryDetail }) {
  const metadataKeys = Object.keys(entry.metadata)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/admin/audit_log">
          <ArrowLeft className="size-4" />
          Back to audit log
        </Link>
      </Button>

      <div className="space-y-1">
        <span className="text-xs font-mono text-muted-foreground uppercase tracking-wide">{entry.action}</span>
        <h1 className="text-2xl font-semibold tracking-tight break-words">{entry.description}</h1>
        <p className="text-sm text-muted-foreground">
          by{' '}
          {entry.actor_id ? (
            <Link href={`/admin/users/${entry.actor_id}`} className="hover:underline">
              {entry.actor_name}
            </Link>
          ) : (
            entry.actor_name
          )}{' '}
          on {entry.created_at}
          {entry.ip_address && <span className="ml-2 font-mono">· {entry.ip_address}</span>}
        </p>
      </div>

      {(entry.target_type || entry.actor_id) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {entry.target_type && entry.target_id && (
            <Card>
              <CardContent className="p-4 space-y-1">
                <span className="text-xs text-muted-foreground uppercase tracking-wide">Target</span>
                <p className="truncate">
                  {entry.target_url ? (
                    <Link href={entry.target_url} className="hover:underline">
                      {entry.target_label || `${entry.target_type} #${entry.target_id}`}
                    </Link>
                  ) : (
                    entry.target_label || `${entry.target_type} #${entry.target_id}`
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {entry.target_type} #{entry.target_id}
                </p>
              </CardContent>
            </Card>
          )}
          {entry.actor_id && (
            <Card>
              <CardContent className="p-4 space-y-1">
                <span className="text-xs text-muted-foreground uppercase tracking-wide">Actor</span>
                <p>
                  <Link href={`/admin/users/${entry.actor_id}`} className="hover:underline">
                    {entry.actor_name}
                  </Link>
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {metadataKeys.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <tbody>
                  {metadataKeys.map((key) => {
                    const value = entry.metadata[key]
                    const isQueryRows = key === 'rows' && Array.isArray(value) && Array.isArray(entry.metadata.columns)
                    return (
                      <tr key={key} className="border-b border-border last:border-b-0">
                        <td className="py-2 pr-4 font-medium align-top w-40">{key}</td>
                        <td className="py-2 font-mono text-xs break-words">
                          {isChangeObject(value) ? (
                            <ChangesTable changes={value} />
                          ) : isQueryRows ? (
                            <QueryResultTable
                              columns={entry.metadata.columns as string[]}
                              rows={value as unknown[][]}
                            />
                          ) : (
                            renderValue(value)
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
