import { router, Link } from '@inertiajs/react'
import Pagination from '@/components/Pagination'
import type { PagyProps } from '@/types'

interface AuditEntry {
  id: number
  item_type: string
  item_id: number
  event: string
  description: string
  actor_name: string
  created_at: string
}

const eventConfig: Record<string, { text: string; icon: string }> = {
  create: { text: 'text-emerald-400', icon: 'add_circle' },
  update: { text: 'text-amber-400', icon: 'edit' },
  destroy: { text: 'text-red-400', icon: 'delete' },
}

export default function AdminAuditLogIndex({
  entries,
  pagy,
  filters,
  item_types,
  events,
}: {
  entries: AuditEntry[]
  pagy: PagyProps
  filters: { item_type: string; event: string }
  item_types: string[]
  events: string[]
}) {
  function applyFilter(key: string, value: string) {
    router.get('/admin/audit_log', { ...filters, [key]: value }, { preserveState: true })
  }

  return (
    <div className="p-12 max-w-[1400px] mx-auto">
      <h1 className="text-4xl font-headline font-bold text-[#e5e2e1] tracking-tight mb-8">Audit Log</h1>

      <div className="flex gap-4 mb-8">
        <div>
          <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-stone-600 mb-2">Type</label>
          <select
            value={filters.item_type}
            onChange={(e) => applyFilter('item_type', e.target.value)}
            className="bg-[#0e0e0e] border-none px-4 py-2 text-[#e5e2e1] text-sm focus:ring-1 focus:ring-[#ee671c]/30"
          >
            <option value="">All types</option>
            {item_types.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-stone-600 mb-2">Event</label>
          <select
            value={filters.event}
            onChange={(e) => applyFilter('event', e.target.value)}
            className="bg-[#0e0e0e] border-none px-4 py-2 text-[#e5e2e1] text-sm focus:ring-1 focus:ring-[#ee671c]/30"
          >
            <option value="">All events</option>
            {events.map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
        </div>
        {(filters.item_type || filters.event) && (
          <div className="flex items-end">
            <button
              onClick={() => router.get('/admin/audit_log')}
              className="ghost-border text-stone-400 hover:text-[#e5e2e1] px-4 py-2 text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {entries.length > 0 ? (
        <>
          <div className="space-y-2">
            {entries.map((entry) => {
              const ec = eventConfig[entry.event] || { text: 'text-stone-400', icon: 'info' }
              return (
                <Link
                  key={entry.id}
                  href={`/admin/audit_log/${entry.id}`}
                  className="block bg-[#1c1b1b] ghost-border px-5 py-4 hover:bg-[#2a2a2a] transition-all group"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`material-symbols-outlined text-lg ${ec.text} shrink-0`}>{ec.icon}</span>
                      <div className="min-w-0">
                        <p className="text-[#e5e2e1] text-sm truncate">{entry.description}</p>
                        <p className="text-stone-600 text-xs mt-0.5">
                          by <span className="text-stone-500">{entry.actor_name}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-stone-600 text-xs">{entry.created_at}</span>
                      <span className="material-symbols-outlined text-stone-600 group-hover:text-[#ffb595] transition-colors text-sm">arrow_forward</span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
          <Pagination pagy={pagy} />
        </>
      ) : (
        <div className="ghost-border bg-[#1c1b1b] p-16 text-center">
          <p className="text-stone-300 text-lg font-headline font-medium mb-2">No audit entries</p>
          <p className="text-stone-500 text-sm">Nothing has been logged yet.</p>
        </div>
      )}
    </div>
  )
}
