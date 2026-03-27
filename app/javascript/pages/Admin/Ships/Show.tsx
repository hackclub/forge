import { Link } from '@inertiajs/react'
import type { AdminShipDetail } from '@/types'

function isSafeUrl(url: string | null): boolean {
  if (!url) return false
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

export default function AdminShipsShow({ ship, can }: { ship: AdminShipDetail; can: { update: boolean } }) {
  return (
    <div className="p-12 max-w-4xl mx-auto">
      <h1 className="text-4xl font-headline font-bold text-[#e5e2e1] tracking-tight mb-2">Ship #{ship.id}</h1>
      <p className="text-stone-500 mb-8">
        for {ship.project_name} by {ship.user_display_name}
      </p>

      <div className="grid grid-cols-2 gap-4 mb-8">
        {[
          { label: 'Status', value: ship.status, capitalize: true },
          { label: 'Reviewer', value: ship.reviewer_display_name ?? 'Unassigned' },
          { label: 'Approved Seconds', value: ship.approved_seconds ?? '—' },
          { label: 'Created', value: ship.created_at },
        ].map((item) => (
          <div key={item.label} className="bg-[#1c1b1b] ghost-border p-4">
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-600">{item.label}</span>
            <p className={`text-[#e5e2e1] mt-1 ${item.capitalize ? 'capitalize' : ''}`}>{String(item.value)}</p>
          </div>
        ))}
      </div>

      {ship.justification && (
        <div className="bg-[#1c1b1b] ghost-border p-4 mb-4">
          <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-600">Justification</span>
          <p className="text-[#e5e2e1] mt-1">{ship.justification}</p>
        </div>
      )}

      {ship.feedback && (
        <div className="bg-[#1c1b1b] ghost-border p-4 mb-4">
          <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-600">Feedback</span>
          <p className="text-[#e5e2e1] mt-1">{ship.feedback}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-[#1c1b1b] ghost-border p-4">
          <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-600">Frozen Demo Link</span>
          <p className="mt-1">
            {isSafeUrl(ship.frozen_demo_link) ? (
              <a href={ship.frozen_demo_link!} target="_blank" rel="noopener" className="text-[#ffb595] hover:text-[#ee671c] transition-colors text-sm break-all">
                {ship.frozen_demo_link}
              </a>
            ) : (
              <span className="text-stone-600">—</span>
            )}
          </p>
        </div>
        <div className="bg-[#1c1b1b] ghost-border p-4">
          <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-600">Frozen Repo Link</span>
          <p className="mt-1">
            {isSafeUrl(ship.frozen_repo_link) ? (
              <a href={ship.frozen_repo_link!} target="_blank" rel="noopener" className="text-[#ffb595] hover:text-[#ee671c] transition-colors text-sm break-all">
                {ship.frozen_repo_link}
              </a>
            ) : (
              <span className="text-stone-600">—</span>
            )}
          </p>
        </div>
      </div>

      {can.update && (
        <Link
          href={`/admin/reviews/${ship.id}/edit`}
          className="signature-smolder text-[#4c1a00] px-6 py-3 font-headline font-bold uppercase tracking-wider inline-flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-lg">edit</span>
          Edit
        </Link>
      )}
    </div>
  )
}
