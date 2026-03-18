import { router, Link } from '@inertiajs/react'
import type { ProjectDetail } from '@/types'

function isSafeUrl(url: string | null): boolean {
  if (!url) return false
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

export default function ProjectsShow({
  project,
  can,
}: {
  project: ProjectDetail
  can: { update: boolean; destroy: boolean }
}) {
  function deleteProject() {
    if (confirm('Are you sure?')) {
      router.delete(`/projects/${project.id}`)
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-black text-yellow-100/90 tracking-tight text-4xl">{project.name}</h1>
        <div className="flex gap-2">
          {can.update && (
            <Link href={`/projects/${project.id}/edit`} className="border border-yellow-800/40 hover:border-yellow-600/50 text-yellow-100/40 hover:text-yellow-400 font-bold uppercase tracking-wider px-4 py-2">
              Edit
            </Link>
          )}
          {can.destroy && (
            <button onClick={deleteProject} className="border border-red-800/40 bg-red-950/20 text-red-400/80 hover:border-red-600/50 font-bold uppercase tracking-wider px-4 py-2">
              Delete
            </button>
          )}
        </div>
      </div>

      {project.is_unlisted && (
        <span className="inline-block text-[10px] uppercase tracking-wider text-yellow-600/50 border border-yellow-800/20 px-2 py-0.5 mb-4">Unlisted</span>
      )}

      {project.description && <p className="text-yellow-100/30 mb-4">{project.description}</p>}

      {project.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {project.tags.map((tag) => (
            <span key={tag} className="text-[10px] uppercase tracking-wider text-yellow-600/50 border border-yellow-800/20 px-2 py-0.5">
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-4 text-sm text-yellow-100/30 mb-6">
        {isSafeUrl(project.demo_link) && (
          <a href={project.demo_link!} target="_blank" rel="noopener" className="text-yellow-500/60 hover:text-yellow-400">
            Demo
          </a>
        )}
        {isSafeUrl(project.repo_link) && (
          <a href={project.repo_link!} target="_blank" rel="noopener" className="text-yellow-500/60 hover:text-yellow-400">
            Repository
          </a>
        )}
      </div>

      <p className="text-sm text-yellow-100/30">
        Created by {project.user_display_name} on {project.created_at}
      </p>
    </div>
  )
}
