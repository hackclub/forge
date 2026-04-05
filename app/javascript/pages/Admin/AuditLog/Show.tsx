import { Link } from '@inertiajs/react'

interface Change {
  field: string
  from: string | null
  to: string | null
}

interface AuditEntryDetail {
  id: number
  item_type: string
  item_id: number
  event: string
  description: string
  actor_id: string | null
  actor_name: string
  created_at: string
  changes: Change[]
}

const eventConfig: Record<string, { label: string; text: string; icon: string }> = {
  create: { label: 'Created', text: 'text-emerald-400', icon: 'add_circle' },
  update: { label: 'Updated', text: 'text-amber-400', icon: 'edit' },
  destroy: { label: 'Deleted', text: 'text-red-400', icon: 'delete' },
}

export default function AdminAuditLogShow({ entry }: { entry: AuditEntryDetail }) {
  const ec = eventConfig[entry.event] || { label: entry.event, text: 'text-stone-400', icon: 'info' }

  const itemLink = entry.item_type === 'User'
    ? `/admin/users/${entry.item_id}`
    : entry.item_type === 'Project'
      ? `/admin/projects/${entry.item_id}`
      : entry.item_type === 'Ship'
        ? `/admin/reviews/${entry.item_id}`
        : null

  return (
    <div className="p-12 max-w-4xl mx-auto">
      <Link href="/admin/audit_log" className="text-stone-500 text-sm hover:text-[#ffb595] transition-colors flex items-center gap-1 mb-8">
        <span className="material-symbols-outlined text-sm">arrow_back</span>
        Back to audit log
      </Link>

      <div className="flex items-center gap-3 mb-4">
        <span className={`${ec.text} flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider`}>
          <span className="material-symbols-outlined text-lg">{ec.icon}</span>
          {ec.label}
        </span>
      </div>

      <h1 className="text-3xl font-headline font-bold text-[#e5e2e1] tracking-tight mb-2">
        {entry.description}
      </h1>
      <p className="text-stone-500 text-sm mb-10">
        by <span className="text-[#ffb595]">{entry.actor_name}</span> on {entry.created_at}
      </p>

      <div className="grid grid-cols-2 gap-4 mb-10">
        <div className="bg-[#1c1b1b] ghost-border p-4">
          <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-600">Record</span>
          <p className="text-[#e5e2e1] mt-1">
            {itemLink ? (
              <Link href={itemLink} className="text-[#ffb595] hover:text-[#ee671c] transition-colors">
                {entry.item_type} #{entry.item_id}
              </Link>
            ) : (
              `${entry.item_type} #${entry.item_id}`
            )}
          </p>
        </div>
        <div className="bg-[#1c1b1b] ghost-border p-4">
          <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-600">Actor</span>
          <p className="text-[#e5e2e1] mt-1">
            {entry.actor_id ? (
              <Link href={`/admin/users/${entry.actor_id}`} className="text-[#ffb595] hover:text-[#ee671c] transition-colors">
                {entry.actor_name}
              </Link>
            ) : (
              entry.actor_name
            )}
          </p>
        </div>
      </div>

      {entry.changes.length > 0 ? (
        <div>
          <h2 className="text-xl font-headline font-bold text-[#e5e2e1] tracking-tight mb-4">Changes</h2>
          <div className="ghost-border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-5 py-3 text-[10px] uppercase tracking-[0.2em] font-bold text-stone-600">Field</th>
                  <th className="text-left px-5 py-3 text-[10px] uppercase tracking-[0.2em] font-bold text-stone-600">Before</th>
                  <th className="text-left px-5 py-3 text-[10px] uppercase tracking-[0.2em] font-bold text-stone-600">After</th>
                </tr>
              </thead>
              <tbody>
                {entry.changes.map((change) => (
                  <tr key={change.field} className="border-b border-white/5">
                    <td className="px-5 py-3 font-headline font-bold text-[#e5e2e1] text-sm">{change.field}</td>
                    <td className="px-5 py-3 text-red-400/70 text-sm max-w-xs break-all">
                      {change.from !== null ? change.from : <span className="text-stone-600">—</span>}
                    </td>
                    <td className="px-5 py-3 text-emerald-400/70 text-sm max-w-xs break-all">
                      {change.to !== null ? change.to : <span className="text-stone-600">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-[#1c1b1b] ghost-border p-8 text-center">
          <p className="text-stone-500 text-sm">No field changes detected.</p>
        </div>
      )}
    </div>
  )
}
