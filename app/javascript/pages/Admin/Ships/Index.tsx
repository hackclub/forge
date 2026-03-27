import { Link } from '@inertiajs/react'
import Pagination from '@/components/Pagination'
import type { AdminShipRow, PagyProps } from '@/types'

export default function AdminShipsIndex({ ships, pagy }: { ships: AdminShipRow[]; pagy: PagyProps }) {
  return (
    <div className="p-12 max-w-[1400px] mx-auto">
      <h1 className="text-4xl font-headline font-bold text-[#e5e2e1] tracking-tight mb-8">Reviews</h1>

      <div className="space-y-2">
        <div className="grid grid-cols-[1fr_1fr_auto_auto_auto_auto] gap-4 px-5 py-3 text-[10px] uppercase tracking-[0.2em] font-bold text-stone-600">
          <span>Project</span>
          <span>Owner</span>
          <span>Status</span>
          <span>Reviewer</span>
          <span>Created</span>
          <span></span>
        </div>
        {ships.map((ship) => (
          <Link
            key={ship.id}
            href={`/admin/reviews/${ship.id}`}
            className="grid grid-cols-[1fr_1fr_auto_auto_auto_auto] gap-4 bg-[#1c1b1b] px-5 py-4 ghost-border hover:bg-[#2a2a2a] transition-all group"
          >
            <span className="font-headline font-bold text-[#e5e2e1] group-hover:text-[#ffb595] transition-colors truncate">{ship.project_name}</span>
            <span className="text-stone-400 text-sm truncate">{ship.user_display_name}</span>
            <span className="text-stone-400 text-xs capitalize">{ship.status}</span>
            <span className="text-stone-500 text-xs">{ship.reviewer_display_name ?? 'Unassigned'}</span>
            <span className="text-stone-500 text-xs">{ship.created_at}</span>
            <span className="material-symbols-outlined text-stone-600 group-hover:text-[#ffb595] transition-colors text-sm">arrow_forward</span>
          </Link>
        ))}
      </div>

      <Pagination pagy={pagy} />
    </div>
  )
}
