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
  if (value === null || value === undefined) return '—'
  if (Array.isArray(value)) return value.length > 0 ? value.join(', ') : '—'
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

export default function AdminAuditLogShow({ entry }: { entry: AuditEntryDetail }) {
  const metadataKeys = Object.keys(entry.metadata)

  return (
    <div className="p-12 max-w-4xl mx-auto">
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
          <div className="ghost-border overflow-hidden">
            <table className="w-full">
              <tbody>
                {metadataKeys.map((key) => (
                  <tr key={key} className="border-b border-white/5">
                    <td className="px-5 py-3 font-headline font-bold text-[#e5e2e1] text-sm align-top w-48">{key}</td>
                    <td className="px-5 py-3 text-stone-400 text-sm break-words [overflow-wrap:anywhere] font-mono">
                      {renderValue(entry.metadata[key])}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
