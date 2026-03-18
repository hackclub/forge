import { Link } from '@inertiajs/react'
import type { AdminUserDetail } from '@/types'

export default function AdminUsersShow({
  user,
  projects,
}: {
  user: AdminUserDetail
  projects: { id: number; name: string; ships_count: number; is_unlisted: boolean; created_at: string }[]
}) {
  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="flex items-center gap-4 mb-6">
        <img src={user.avatar} alt={user.display_name} className="w-16 h-16 rounded-full" />
        <div>
          <h1 className="font-bold text-4xl">
            {user.display_name}
            {user.is_discarded && (
              <span className="text-sm text-red-500 font-normal"> Deleted on {user.discarded_at}</span>
            )}
          </h1>
          <p className="text-gray-500">{user.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <span className="text-sm text-gray-500">Roles</span>
          <p>{user.roles.join(', ')}</p>
        </div>
        <div>
          <span className="text-sm text-gray-500">Timezone</span>
          <p>{user.timezone}</p>
        </div>
        <div>
          <span className="text-sm text-gray-500">Joined</span>
          <p>{user.created_at}</p>
        </div>
        <div>
          <span className="text-sm text-gray-500">Banned</span>
          <p>{user.is_banned ? 'Yes' : 'No'}</p>
        </div>
      </div>

      <h2 className="font-bold text-2xl mb-4">Projects ({projects.length})</h2>

      {projects.length > 0 ? (
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b text-left">
              <th className="py-2 px-3">Name</th>
              <th className="py-2 px-3">Ships</th>
              <th className="py-2 px-3">Unlisted</th>
              <th className="py-2 px-3">Created</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => (
              <tr key={project.id} className="border-b hover:bg-gray-50">
                <td className="py-2 px-3">
                  <Link href={`/admin/projects/${project.id}`} className="text-blue-600 hover:underline">
                    {project.name}
                  </Link>
                </td>
                <td className="py-2 px-3">{project.ships_count}</td>
                <td className="py-2 px-3">{project.is_unlisted ? 'Yes' : 'No'}</td>
                <td className="py-2 px-3">{project.created_at}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-gray-500">No projects yet.</p>
      )}
    </div>
  )
}
