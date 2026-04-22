import { Link } from '@inertiajs/react'

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
  if (keys.length === 0) return <span className="text-stone-600">-</span>
  return (
    <table className="w-full text-xs">
      <thead>
        <tr className="text-left text-stone-600">
          <th className="py-1 pr-3 font-bold uppercase tracking-[0.15em]">Field</th>
          <th className="py-1 pr-3 font-bold uppercase tracking-[0.15em]">Before</th>
          <th className="py-1 font-bold uppercase tracking-[0.15em]">After</th>
        </tr>
      </thead>
      <tbody>
        {keys.map((k) => (
          <tr key={k} className="border-t border-white/5 align-top">
            <td className="py-1 pr-3 text-[#e5e2e1] font-bold">{k}</td>
            <td className="py-1 pr-3 text-red-300/80 break-words [overflow-wrap:anywhere]">{renderValue(changes[k].from)}</td>
            <td className="py-1 text-emerald-300/80 break-words [overflow-wrap:anywhere]">{renderValue(changes[k].to)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function QueryResultTable({ columns, rows }: { columns: string[]; rows: unknown[][] }) {
  return (
    <div className="overflow-x-auto ghost-border">
      <table className="w-full text-xs">
        <thead className="bg-[#0e0e0e]">
          <tr className="text-left text-stone-500">
            {columns.map((c) => (
              <th key={c} className="px-3 py-2 font-bold uppercase tracking-[0.15em]">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-white/5">
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-2 text-stone-400 font-mono break-words [overflow-wrap:anywhere]">
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
    <div className="p-5 md:p-12 max-w-4xl mx-auto">
      <Link href="/admin/audit_log" className="text-stone-500 text-sm hover:text-[#ffb595] transition-colors flex items-center gap-1 mb-8">
        <span className="material-symbols-outlined text-sm">arrow_back</span>
        Back to audit log
      </Link>

      <div className="flex items-center gap-3 mb-4">
        <span className="text-[#ee671c] text-xs font-bold uppercase tracking-wider font-mono">
          {entry.action}
        </span>
      </div>

      <h1 className="text-3xl font-headline font-bold text-[#e5e2e1] tracking-tight mb-2 break-words">
        {entry.description}
      </h1>
      <p className="text-stone-500 text-sm mb-10">
        by{' '}
        {entry.actor_id ? (
          <Link href={`/admin/users/${entry.actor_id}`} className="text-[#ffb595] hover:text-[#ee671c] transition-colors">
            {entry.actor_name}
          </Link>
        ) : (
          <span className="text-[#ffb595]">{entry.actor_name}</span>
        )}{' '}
        on {entry.created_at}
        {entry.ip_address && (
          <>
            <span className="text-stone-700 mx-2">·</span>
            <span className="font-mono text-stone-600">{entry.ip_address}</span>
          </>
        )}
      </p>

      {(entry.target_type || entry.actor_id) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          {entry.target_type && entry.target_id && (
            <div className="bg-[#1c1b1b] ghost-border p-4 min-w-0 overflow-hidden">
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-600">Target</span>
              <p className="text-[#e5e2e1] mt-1 truncate">
                {entry.target_url ? (
                  <Link href={entry.target_url} className="text-[#ffb595] hover:text-[#ee671c] transition-colors">
                    {entry.target_label || `${entry.target_type} #${entry.target_id}`}
                  </Link>
                ) : (
                  entry.target_label || `${entry.target_type} #${entry.target_id}`
                )}
              </p>
              <p className="text-[10px] text-stone-600 mt-1">{entry.target_type} #{entry.target_id}</p>
            </div>
          )}
          {entry.actor_id && (
            <div className="bg-[#1c1b1b] ghost-border p-4 min-w-0 overflow-hidden">
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-600">Actor</span>
              <p className="text-[#e5e2e1] mt-1">
                <Link href={`/admin/users/${entry.actor_id}`} className="text-[#ffb595] hover:text-[#ee671c] transition-colors">
                  {entry.actor_name}
                </Link>
              </p>
            </div>
          )}
        </div>
      )}

      {metadataKeys.length > 0 && (
        <div>
          <h2 className="text-xl font-headline font-bold text-[#e5e2e1] tracking-tight mb-4">Details</h2>
          <div className="ghost-border overflow-x-auto">
            <table className="w-full min-w-[480px]">
              <tbody>
                {metadataKeys.map((key) => {
                  const value = entry.metadata[key]
                  const isQueryRows =
                    key === 'rows' &&
                    Array.isArray(value) &&
                    Array.isArray(entry.metadata.columns)
                  return (
                    <tr key={key} className="border-b border-white/5">
                      <td className="px-5 py-3 font-headline font-bold text-[#e5e2e1] text-sm align-top w-48">{key}</td>
                      <td className="px-5 py-3 text-stone-400 text-sm break-words [overflow-wrap:anywhere] font-mono">
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
        </div>
      )}
    </div>
  )
}
