import { router, Link } from '@inertiajs/react'
import Pagination from '@/components/Pagination'
import type { PagyProps } from '@/types'

interface AuditEntry {
  id: number
  action: string
  description: string
  actor_id: number | null
  actor_name: string
  target_type: string | null
  target_id: number | null
  target_label: string | null
  target_url: string | null
  created_at: string
}

const ACTION_ICONS: Record<string, { icon: string; color: string }> = {
  approved: { icon: 'check_circle', color: 'text-emerald-400' },
  returned: { icon: 'undo', color: 'text-amber-400' },
  rejected: { icon: 'cancel', color: 'text-red-400' },
  destroyed: { icon: 'delete', color: 'text-red-400' },
  soft_deleted: { icon: 'delete_sweep', color: 'text-red-400' },
  restored: { icon: 'restore', color: 'text-emerald-400' },
  created: { icon: 'add_circle', color: 'text-emerald-400' },
  updated: { icon: 'edit', color: 'text-amber-400' },
  toggled: { icon: 'toggle_on', color: 'text-amber-400' },
  banned: { icon: 'gavel', color: 'text-red-400' },
  unbanned: { icon: 'verified_user', color: 'text-emerald-400' },
  permissions_updated: { icon: 'key', color: 'text-amber-400' },
  roles_updated: { icon: 'badge', color: 'text-amber-400' },
  beta_approval_toggled: { icon: 'verified', color: 'text-amber-400' },
  note_added: { icon: 'sticky_note_2', color: 'text-stone-400' },
  note_destroyed: { icon: 'sticky_note_2', color: 'text-red-400' },
  kudo_added: { icon: 'favorite', color: 'text-[#ee671c]' },
  kudo_destroyed: { icon: 'heart_broken', color: 'text-red-400' },
  signed_in: { icon: 'login', color: 'text-stone-400' },
  signed_out: { icon: 'logout', color: 'text-stone-400' },
  queried: { icon: 'database', color: 'text-amber-400' },
  exported: { icon: 'download', color: 'text-stone-400' },
  replied: { icon: 'reply', color: 'text-stone-400' },
  claimed: { icon: 'pan_tool', color: 'text-amber-400' },
  resolved: { icon: 'task_alt', color: 'text-emerald-400' },
  visibility_toggled: { icon: 'visibility', color: 'text-amber-400' },
  staff_pick_toggled: { icon: 'star', color: 'text-amber-400' },
  publish_toggled: { icon: 'campaign', color: 'text-amber-400' },
  reverted_to_draft: { icon: 'undo', color: 'text-amber-400' },
  pitch_approved: { icon: 'check_circle', color: 'text-emerald-400' },
  review_notes_saved: { icon: 'edit_note', color: 'text-amber-400' },
  readme_refreshed: { icon: 'refresh', color: 'text-stone-400' },
}

function iconFor(action: string) {
  const verb = action.split('.').pop() || ''
  return ACTION_ICONS[verb] || { icon: 'info', color: 'text-stone-400' }
}

export default function AdminAuditLogIndex({
  entries,
  pagy,
  filters,
  actions,
  target_types,
}: {
  entries: AuditEntry[]
  pagy: PagyProps
  filters: { action: string; target_type: string; actor_id: string }
  actions: string[]
  target_types: string[]
}) {
  function applyFilter(key: string, value: string) {
    const params = { ...filters, [key]: value }
    router.get(
      '/admin/audit_log',
      { action_filter: params.action, target_type: params.target_type, actor_id: params.actor_id },
      { preserveState: true },
    )
  }

  return (
    <div className="p-5 md:p-12 max-w-[1400px] mx-auto">
      <h1 className="text-4xl font-headline font-bold text-[#e5e2e1] tracking-tight mb-2">Audit Log</h1>

      <div className="flex flex-wrap gap-4 mb-8">
        <div>
          <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-stone-600 mb-2">Action</label>
          <select
            value={filters.action}
            onChange={(e) => applyFilter('action', e.target.value)}
            className="bg-[#0e0e0e] border-none px-4 py-2 text-[#e5e2e1] text-sm focus:ring-1 focus:ring-[#ee671c]/30"
          >
            <option value="">All actions</option>
            {actions.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-stone-600 mb-2">
            Target Type
          </label>
          <select
            value={filters.target_type}
            onChange={(e) => applyFilter('target_type', e.target.value)}
            className="bg-[#0e0e0e] border-none px-4 py-2 text-[#e5e2e1] text-sm focus:ring-1 focus:ring-[#ee671c]/30"
          >
            <option value="">All targets</option>
            {target_types.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        {(filters.action || filters.target_type || filters.actor_id) && (
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
              const ic = iconFor(entry.action)
              return (
                <Link
                  key={entry.id}
                  href={`/admin/audit_log/${entry.id}`}
                  className="block bg-[#1c1b1b] ghost-border px-5 py-4 hover:bg-[#2a2a2a] transition-all group"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`material-symbols-outlined text-lg ${ic.color} shrink-0`}>{ic.icon}</span>
                      <div className="min-w-0">
                        <p className="text-[#e5e2e1] text-sm truncate">{entry.description}</p>
                        <p className="text-stone-600 text-xs mt-0.5">
                          by <span className="text-stone-500">{entry.actor_name}</span>
                          <span className="text-stone-700 mx-2">·</span>
                          <span className="text-stone-600 font-mono">{entry.action}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-stone-600 text-xs">{entry.created_at}</span>
                      <span className="material-symbols-outlined text-stone-600 group-hover:text-[#ffb595] transition-colors text-sm">
                        arrow_forward
                      </span>
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
