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
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="font-bold text-4xl mb-2">Ship #{ship.id}</h1>
      <p className="text-gray-500 mb-6">
        for {ship.project_name} by {ship.user_display_name}
      </p>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <span className="text-sm text-gray-500">Status</span>
          <p className="capitalize">{ship.status}</p>
        </div>
        <div>
          <span className="text-sm text-gray-500">Reviewer</span>
          <p>{ship.reviewer_display_name ?? 'Unassigned'}</p>
        </div>
        <div>
          <span className="text-sm text-gray-500">Approved Seconds</span>
          <p>{ship.approved_seconds ?? '—'}</p>
        </div>
        <div>
          <span className="text-sm text-gray-500">Created</span>
          <p>{ship.created_at}</p>
        </div>
      </div>

      {ship.justification && (
        <div className="mb-4">
          <span className="text-sm text-gray-500">Justification</span>
          <p className="mt-1">{ship.justification}</p>
        </div>
      )}

      {ship.feedback && (
        <div className="mb-4">
          <span className="text-sm text-gray-500">Feedback</span>
          <p className="mt-1">{ship.feedback}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <span className="text-sm text-gray-500">Frozen Demo Link</span>
          <p>
            {isSafeUrl(ship.frozen_demo_link) ? (
              <a href={ship.frozen_demo_link!} target="_blank" rel="noopener" className="text-blue-600 hover:underline">
                {ship.frozen_demo_link}
              </a>
            ) : (
              '—'
            )}
          </p>
        </div>
        <div>
          <span className="text-sm text-gray-500">Frozen Repo Link</span>
          <p>
            {isSafeUrl(ship.frozen_repo_link) ? (
              <a href={ship.frozen_repo_link!} target="_blank" rel="noopener" className="text-blue-600 hover:underline">
                {ship.frozen_repo_link}
              </a>
            ) : (
              '—'
            )}
          </p>
        </div>
      </div>

      {can.update && (
        <div className="mt-6">
          <Link
            href={`/admin/reviews/${ship.id}/edit`}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Edit
          </Link>
        </div>
      )}
    </div>
  )
}
