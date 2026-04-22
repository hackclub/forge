import { Link, router } from '@inertiajs/react'

type Status = 'pending' | 'sent' | 'cancelled' | 'failed'

interface QueueItemDetail {
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
  payload: Record<string, unknown>
}

const statusStyles: Record<Status, { bg: string; text: string; icon: string; label: string }> = {
  pending: { bg: 'bg-amber-500/10', text: 'text-amber-400', icon: 'schedule', label: 'Pending' },
  sent: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', icon: 'check_circle', label: 'Sent' },
  cancelled: { bg: 'bg-stone-500/10', text: 'text-stone-400', icon: 'cancel', label: 'Cancelled' },
  failed: { bg: 'bg-red-500/10', text: 'text-red-400', icon: 'error', label: 'Failed' },
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
  const st = statusStyles[item.status]
  const fieldKeys = Object.keys(item.payload || {})

  function send() {
    if (!confirm(`Send this payload to Airtable table "${item.table_name}"? This will upsert the record via Forge Project ID = ${item.forge_id}.`)) return
    router.post(`/admin/airtable_queue/${item.id}/send_to_airtable`)
  }

  function cancel() {
    if (!confirm('Cancel this queue item? It will not be sent.')) return
    router.post(`/admin/airtable_queue/${item.id}/cancel`)
  }

  return (
    <div className="p-5 md:p-12 max-w-5xl mx-auto">
      <Link href="/admin/airtable_queue" className="text-stone-500 text-sm hover:text-[#ffb595] transition-colors flex items-center gap-1 mb-8">
        <span className="material-symbols-outlined text-sm">arrow_back</span>
        Back to queue
      </Link>

      <div className="flex items-center gap-3 mb-4">
        <span className={`${st.bg} ${st.text} px-3 py-1 text-[10px] uppercase font-bold tracking-widest flex items-center gap-1.5`}>
          <span className="material-symbols-outlined text-sm">{st.icon}</span>
          {st.label}
        </span>
        <span className="text-[#ee671c] text-xs font-bold uppercase tracking-wider font-mono">
          {item.table_name}
        </span>
      </div>

      <h1 className="text-3xl font-headline font-bold text-[#e5e2e1] tracking-tight mb-2 break-words">
        {item.project_name || `Forge #${item.forge_id}`}
      </h1>
      <p className="text-stone-500 text-sm mb-10">
        Enqueued {item.created_at} by <span className="text-[#ffb595]">{item.enqueued_by || 'system'}</span>
        {item.sent_at && (
          <>
            <span className="text-stone-700 mx-2">·</span>
            Sent {item.sent_at} by <span className="text-[#ffb595]">{item.sent_by}</span>
          </>
        )}
        {item.airtable_record_id && (
          <>
            <span className="text-stone-700 mx-2">·</span>
            <span className="font-mono text-stone-600">{item.airtable_record_id}</span>
          </>
        )}
      </p>

      {item.error && (
        <div className="ghost-border bg-red-500/5 border-red-500/20 p-4 mb-8">
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-red-400 mb-2">Last error</p>
          <p className="text-red-300 text-sm font-mono break-words [overflow-wrap:anywhere]">{item.error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {item.project_id && (
          <div className="bg-[#1c1b1b] ghost-border p-4">
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-600">Project</span>
            <p className="mt-1">
              <Link href={`/admin/projects/${item.project_id}`} className="text-[#ffb595] hover:text-[#ee671c] transition-colors">
                {item.project_name}
              </Link>
            </p>
          </div>
        )}
        <div className="bg-[#1c1b1b] ghost-border p-4">
          <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-600">Forge Project ID</span>
          <p className="text-[#e5e2e1] mt-1 font-mono">{item.forge_id}</p>
        </div>
      </div>

      <h2 className="text-xl font-headline font-bold text-[#e5e2e1] tracking-tight mb-4 flex items-center gap-2">
        <span className="material-symbols-outlined">table_view</span>
        Airtable Preview
      </h2>
      <p className="text-stone-500 text-sm mb-4">Double-check every field below. This is exactly what will be upserted.</p>

      <div className="ghost-border overflow-x-auto mb-8">
        <table className="w-full min-w-[640px]">
          <thead className="bg-[#0e0e0e]">
            <tr className="text-left text-stone-500">
              <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.2em] w-64">Field</th>
              <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.2em]">Value</th>
            </tr>
          </thead>
          <tbody>
            {fieldKeys.length === 0 ? (
              <tr>
                <td colSpan={2} className="px-5 py-6 text-stone-600 text-sm italic">Empty payload.</td>
              </tr>
            ) : (
              fieldKeys.map((k) => {
                const v = item.payload[k]
                const empty = v === null || v === undefined || v === ''
                return (
                  <tr key={k} className="border-b border-white/5 align-top">
                    <td className="px-5 py-3 font-headline font-bold text-[#e5e2e1] text-sm">{k}</td>
                    <td className={`px-5 py-3 text-sm break-words [overflow-wrap:anywhere] font-mono whitespace-pre-wrap ${empty ? 'text-stone-600 italic' : 'text-stone-300'}`}>
                      {empty ? '-' : renderValue(v)}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {item.status === 'pending' && (
        <div className="ghost-border bg-[#1c1b1b] p-6 flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
          <div>
            <h3 className="text-sm font-headline font-bold text-[#e5e2e1] mb-1">Final check</h3>
            <p className="text-stone-500 text-xs">Once sent, the record is upserted into Airtable by Forge Project ID.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={cancel}
              className="ghost-border bg-[#0e0e0e] hover:bg-[#2a2a2a] text-stone-400 hover:text-[#e5e2e1] px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] cursor-pointer transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">cancel</span>
              Cancel
            </button>
            <button
              onClick={send}
              disabled={!airtable_enabled}
              className="signature-smolder text-[#4c1a00] px-5 py-2 text-xs font-bold uppercase tracking-[0.15em] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">send</span>
              Send to Airtable
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
