import { Link } from '@inertiajs/react'
import type { AdminProjectDetail } from '@/types'

function isSafeUrl(url: string | null): boolean {
  if (!url) return false
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

export default function AdminProjectsShow({
  project,
  ships,
}: {
  project: AdminProjectDetail
  ships: {
    id: number
    status: string
    reviewer_display_name: string | null
    approved_seconds: number | null
    created_at: string
  }[]
}) {
  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="font-bold text-4xl mb-2">
        {project.name}
        {project.is_discarded && (
          <span className="text-sm text-red-500 font-normal"> Deleted on {project.discarded_at}</span>
        )}
      </h1>
      <p className="text-gray-500 mb-6">
        Owned by{' '}
        <Link href={`/admin/users/${project.user_id}`} className="text-blue-600 hover:underline">
          {project.user_display_name}
        </Link>
      </p>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <span className="text-sm text-gray-500">Unlisted</span>
          <p>{project.is_unlisted ? 'Yes' : 'No'}</p>
        </div>
        <div>
          <span className="text-sm text-gray-500">Tags</span>
          <p>{project.tags.length > 0 ? project.tags.join(', ') : 'None'}</p>
        </div>
        <div>
          <span className="text-sm text-gray-500">Demo Link</span>
          <p>
            {isSafeUrl(project.demo_link) ? (
              <a href={project.demo_link!} target="_blank" rel="noopener" className="text-blue-600 hover:underline">
                {project.demo_link}
              </a>
            ) : (
              'None'
            )}
          </p>
        </div>
        <div>
          <span className="text-sm text-gray-500">Repo Link</span>
          <p>
            {isSafeUrl(project.repo_link) ? (
              <a href={project.repo_link!} target="_blank" rel="noopener" className="text-blue-600 hover:underline">
                {project.repo_link}
              </a>
            ) : (
              'None'
            )}
          </p>
        </div>
      </div>

      {project.description && (
        <div className="mb-6">
          <span className="text-sm text-gray-500">Description</span>
          <p className="mt-1">{project.description}</p>
        </div>
      )}

      <h2 className="font-bold text-2xl mb-4">Ships ({ships.length})</h2>

      {ships.length > 0 ? (
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b text-left">
              <th className="py-2 px-3">Status</th>
              <th className="py-2 px-3">Reviewer</th>
              <th className="py-2 px-3">Approved Seconds</th>
              <th className="py-2 px-3">Created</th>
              <th className="py-2 px-3"></th>
            </tr>
          </thead>
          <tbody>
            {ships.map((ship) => (
              <tr key={ship.id} className="border-b hover:bg-gray-50">
                <td className="py-2 px-3">
                  <span className="capitalize">{ship.status}</span>
                </td>
                <td className="py-2 px-3">{ship.reviewer_display_name ?? 'Unassigned'}</td>
                <td className="py-2 px-3">{ship.approved_seconds ?? '—'}</td>
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
      ) : (
        <p className="text-gray-500">No ships yet.</p>
      )}
    </div>
  )
}
