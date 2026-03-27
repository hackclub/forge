import { useForm, usePage } from '@inertiajs/react'
import type { ShipForm, SharedProps } from '@/types'

export default function AdminShipsEdit({ ship, statuses }: { ship: ShipForm; statuses: string[] }) {
  const { errors } = usePage<SharedProps>().props

  const form = useForm({
    status: ship.status,
    feedback: ship.feedback,
    justification: ship.justification,
    approved_seconds: ship.approved_seconds,
  })

  function submit(e: React.FormEvent) {
    e.preventDefault()
    form.patch(`/admin/reviews/${ship.id}`)
  }

  return (
    <div className="p-12 max-w-2xl mx-auto">
      <h1 className="text-4xl font-headline font-bold text-[#e5e2e1] tracking-tight mb-2">Review Ship #{ship.id}</h1>
      <p className="text-stone-500 mb-8">
        for {ship.project_name} by {ship.user_display_name}
      </p>

      <form onSubmit={submit} className="space-y-6">
        {Object.keys(errors).length > 0 && (
          <div className="ghost-border bg-red-500/10 text-red-400 p-4 flex items-start gap-3">
            <span className="material-symbols-outlined text-lg shrink-0 mt-0.5">error</span>
            <ul className="text-sm space-y-1">
              {Object.entries(errors).map(([field, messages]) =>
                messages.map((msg) => (
                  <li key={`${field}-${msg}`}>
                    {field} {msg}
                  </li>
                )),
              )}
            </ul>
          </div>
        )}

        <div>
          <label htmlFor="status" className="block text-xs font-bold uppercase tracking-[0.2em] text-stone-500 mb-2">
            Status
          </label>
          <select
            id="status"
            value={form.data.status}
            onChange={(e) => form.setData('status', e.target.value)}
            className="w-full bg-[#0e0e0e] border-none px-4 py-3 text-[#e5e2e1] focus:ring-1 focus:ring-[#ee671c]/30"
          >
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="feedback" className="block text-xs font-bold uppercase tracking-[0.2em] text-stone-500 mb-2">
            Feedback
          </label>
          <textarea
            id="feedback"
            value={form.data.feedback}
            onChange={(e) => form.setData('feedback', e.target.value)}
            rows={4}
            className="w-full bg-[#0e0e0e] border-none px-4 py-3 text-[#e5e2e1] focus:ring-1 focus:ring-[#ee671c]/30 placeholder:text-stone-600 resize-y"
          />
        </div>

        <div>
          <label htmlFor="justification" className="block text-xs font-bold uppercase tracking-[0.2em] text-stone-500 mb-2">
            Justification
          </label>
          <input
            type="text"
            id="justification"
            value={form.data.justification}
            onChange={(e) => form.setData('justification', e.target.value)}
            className="w-full bg-[#0e0e0e] border-none px-4 py-3 text-[#e5e2e1] focus:ring-1 focus:ring-[#ee671c]/30 placeholder:text-stone-600"
          />
        </div>

        <div>
          <label htmlFor="approved_seconds" className="block text-xs font-bold uppercase tracking-[0.2em] text-stone-500 mb-2">
            Approved Seconds
          </label>
          <input
            type="number"
            id="approved_seconds"
            value={form.data.approved_seconds ?? ''}
            onChange={(e) => form.setData('approved_seconds', e.target.value ? Number(e.target.value) : null)}
            className="w-full bg-[#0e0e0e] border-none px-4 py-3 text-[#e5e2e1] focus:ring-1 focus:ring-[#ee671c]/30 placeholder:text-stone-600"
          />
        </div>

        <button
          type="submit"
          className="signature-smolder text-[#4c1a00] px-8 py-3 font-headline font-bold uppercase tracking-wider active:scale-95 transition-transform flex items-center gap-2"
          disabled={form.processing}
        >
          {form.processing ? (
            <>
              <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
              Updating...
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-lg">save</span>
              Update Ship
            </>
          )}
        </button>
      </form>
    </div>
  )
}
