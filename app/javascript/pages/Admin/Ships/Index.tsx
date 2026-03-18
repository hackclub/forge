import { Link } from '@inertiajs/react'
import Pagination from '@/components/Pagination'
import type { AdminShipRow, PagyProps } from '@/types'

export default function AdminShipsIndex({ ships, pagy }: { ships: AdminShipRow[]; pagy: PagyProps }) {
  return (
    <div className="max-w-6xl mx-auto py-8">
      <h1 className="font-bold text-4xl mb-6">Admin: Reviews</h1>

      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b text-left">
            <th className="py-2 px-3">Project</th>
            <th className="py-2 px-3">Owner</th>
            <th className="py-2 px-3">Status</th>
            <th className="py-2 px-3">Reviewer</th>
            <th className="py-2 px-3">Created</th>
            <th className="py-2 px-3"></th>
          </tr>
        </thead>
        <tbody>
          {ships.map((ship) => (
            <tr key={ship.id} className="border-b hover:bg-gray-50">
              <td className="py-2 px-3">{ship.project_name}</td>
              <td className="py-2 px-3">{ship.user_display_name}</td>
              <td className="py-2 px-3">
                <span className="capitalize">{ship.status}</span>
              </td>
              <td className="py-2 px-3">{ship.reviewer_display_name ?? 'Unassigned'}</td>
              <td className="py-2 px-3">{ship.created_at}</td>
              <td className="py-2 px-3">
                <Link href={`/admin/reviews/${ship.id}`} className="text-blue-600 hover:underline">
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Pagination pagy={pagy} />
    </div>
  )
}
