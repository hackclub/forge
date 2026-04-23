import { Link, router } from '@inertiajs/react'
import Pagination from '@/components/Pagination'
import type { PagyProps } from '@/types'

type Status = 'pending' | 'sent' | 'cancelled' | 'failed'

interface QueueItem {
  id: number
  status: Status
  table_name: string
  forge_id: string
  project_id: number | null
  project_name: string | null
  enqueued_by: string | null
  sent_by: string | null
  sent_at: string | null
  airtable_record_id: string | null
  error: string | null
  created_at: string
}

const statusStyles: Record<Status, { bg: string; text: string; icon: string; label: string }> = {
  pending: { bg: 'bg-amber-500/10', text: 'text-amber-400', icon: 'schedule', label: 'Pending' },
  sent: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', icon: 'check_circle', label: 'Sent' },
  cancelled: { bg: 'bg-stone-500/10', text: 'text-stone-400', icon: 'cancel', label: 'Cancelled' },
  failed: { bg: 'bg-red-500/10', text: 'text-red-400', icon: 'error', label: 'Failed' },
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
    <div className="p-5 md:p-12 max-w-[1400px] mx-auto">
      <h1 className="text-4xl font-headline font-bold text-[#e5e2e1] tracking-tight mb-2">Airtable Queue</h1>
      <p className="text-stone-500 text-sm mb-6">
        Staging area for Airtable projects. Review the submission before sending it off.
      </p>

      {!airtable_enabled && (
        <div className="ghost-border bg-red-500/5 border-red-500/20 p-4 mb-6 text-red-400 text-sm">
          Airtable is not configured. Items can be enqueued but not sent.
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {(['pending', 'sent', 'failed', 'cancelled'] as Status[]).map((s) => (
          <div
            key={s}
            className={`bg-[#1c1b1b] ghost-border p-4 ${filters.status === s ? 'ring-1 ring-[#ee671c]/30' : ''}`}
          >
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-500 mb-1">
              {statusStyles[s].label}
            </p>
            <p className={`text-2xl font-headline font-bold ${statusStyles[s].text}`}>{counts[s]}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => applyFilter('')}
          className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] transition-colors cursor-pointer ${filters.status === '' ? 'signature-smolder text-[#4c1a00]' : 'ghost-border bg-[#1c1b1b] text-stone-400 hover:bg-[#2a2a2a]'}`}
        >
          All
        </button>
        {(['pending', 'sent', 'failed', 'cancelled'] as Status[]).map((s) => (
          <button
            key={s}
            onClick={() => applyFilter(s)}
            className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] transition-colors cursor-pointer ${filters.status === s ? 'signature-smolder text-[#4c1a00]' : 'ghost-border bg-[#1c1b1b] text-stone-400 hover:bg-[#2a2a2a]'}`}
          >
            {statusStyles[s].label}
          </button>
        ))}
      </div>

      {items.length > 0 ? (
        <>
          <div className="space-y-2">
            {items.map((item) => {
              const st = statusStyles[item.status]
              return (
                <Link
                  key={item.id}
                  href={`/admin/airtable_queue/${item.id}`}
                  className="block bg-[#1c1b1b] ghost-border px-5 py-4 hover:bg-[#2a2a2a] transition-all group"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`${st.bg} ${st.text} px-2 py-1 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 shrink-0`}
                      >
                        <span className="material-symbols-outlined text-xs">{st.icon}</span>
                        {st.label}
                      </span>
                      <div className="min-w-0">
                        <p className="text-[#e5e2e1] text-sm truncate">
                          {item.project_name || `Forge #${item.forge_id}`}
                        </p>
                        <p className="text-stone-600 text-xs mt-0.5">
                          <span className="font-mono">{item.table_name}</span>
                          <span className="text-stone-700 mx-2">·</span>
                          enqueued by {item.enqueued_by || 'system'}
                          {item.sent_by && (
                            <>
                              <span className="text-stone-700 mx-2">·</span>
                              sent by {item.sent_by}
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-stone-600 text-xs">{item.created_at}</span>
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
          <p className="text-stone-300 text-lg font-headline font-medium mb-2">Queue is empty</p>
          <p className="text-stone-500 text-sm">Airtable-bound records will appear here for review before sending.</p>
        </div>
      )}
    </div>
  )
}
