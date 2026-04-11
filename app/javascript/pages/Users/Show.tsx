import { useState } from 'react'
import { Head, Link, router } from '@inertiajs/react'
import type { ProjectStatus } from '@/types'

interface ProfileUser {
  id: number
  display_name: string
  avatar: string
  joined_at: string
}

interface ProfileStats {
  total_hours: number
  projects_count: number
  approved_count: number
  devlog_count: number
  kudos_count: number
}

interface ProfileProject {
  id: number
  name: string
  subtitle: string | null
  status: ProjectStatus
  cover_image_url: string | null
  total_hours: number
  created_at: string
}

interface ProfileKudo {
  id: number
  content: string
  author_id: number
  author_name: string
  author_avatar: string
  author_is_staff: boolean
  can_destroy: boolean
  created_at: string
}

interface Props {
  user: ProfileUser
  stats: ProfileStats
  projects: ProfileProject[]
  kudos: ProfileKudo[]
  can_give_kudos: boolean
}

const STATUS_LABELS: Record<ProjectStatus, string> = {
  draft: 'Draft',
  pending: 'Pending',
  approved: 'Approved',
  returned: 'Returned',
  rejected: 'Rejected',
  build_pending: 'Build Pending',
  build_approved: 'Shipped',
}

const STATUS_COLORS: Record<ProjectStatus, string> = {
  draft: 'bg-stone-500/15 text-stone-400',
  pending: 'bg-amber-500/15 text-amber-400',
  approved: 'bg-emerald-500/15 text-emerald-400',
  returned: 'bg-orange-500/15 text-orange-400',
  rejected: 'bg-red-500/15 text-red-400',
  build_pending: 'bg-amber-500/15 text-amber-400',
  build_approved: 'bg-emerald-500/15 text-emerald-400',
}

function StatTile({ label, value, icon }: { label: string; value: string | number; icon: string }) {
  return (
    <div className="bg-[#1c1b1b] ghost-border p-5 flex items-center gap-4">
      <span className="material-symbols-outlined text-[#ee671c] text-3xl">{icon}</span>
      <div>
        <p className="text-2xl font-headline font-bold text-[#e5e2e1] tracking-tight">{value}</p>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">{label}</p>
      </div>
    </div>
  )
}

export default function UsersShow({ user, stats, projects, kudos, can_give_kudos }: Props) {
  const [kudoContent, setKudoContent] = useState('')

  function submitKudo(e: React.FormEvent) {
    e.preventDefault()
    if (!kudoContent.trim()) return
    router.post(`/users/${user.id}/kudos`, { content: kudoContent }, {
      onSuccess: () => setKudoContent(''),
    })
  }

  function deleteKudo(kudoId: number) {
    if (!confirm('Delete this kudos?')) return
    router.delete(`/users/${user.id}/kudos/${kudoId}`)
  }

  return (
    <>
      <Head title={`${user.display_name} — Forge`} />
      <div className="p-12 max-w-6xl mx-auto space-y-10">
        <section className="bg-[#1c1b1b] ghost-border p-8 flex items-center gap-6">
          <img
            src={user.avatar}
            alt={user.display_name}
            className="w-24 h-24 border border-white/10 shrink-0"
          />
          <div className="min-w-0">
            <h1 className="text-4xl font-headline font-bold text-[#e5e2e1] tracking-tight break-words">
              {user.display_name}
            </h1>
            <p className="text-stone-500 text-sm mt-2">Forging since {user.joined_at}</p>
          </div>
        </section>

        <section>
          <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500 font-headline mb-4">Achievements</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <StatTile label="Hours" value={stats.total_hours} icon="schedule" />
            <StatTile label="Projects" value={stats.projects_count} icon="folder_open" />
            <StatTile label="Approved" value={stats.approved_count} icon="verified" />
            <StatTile label="Devlogs" value={stats.devlog_count} icon="edit_note" />
            <StatTile label="Kudos" value={stats.kudos_count} icon="favorite" />
          </div>
        </section>

        <section className="bg-[#1c1b1b] ghost-border p-8">
          <h2 className="text-2xl font-headline font-bold text-[#e5e2e1] tracking-tight mb-6">Projects</h2>

          {projects.length === 0 ? (
            <div className="p-12 text-center">
              <span
                className="material-symbols-outlined text-6xl text-[#ee671c] mb-4 block"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                precision_manufacturing
              </span>
              <p className="text-stone-500 text-sm">No public projects yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="group bg-[#0e0e0e] ghost-border hover:bg-[#161616] transition-colors flex flex-col min-w-0 overflow-hidden"
                >
                  <div className="aspect-[16/10] overflow-hidden bg-[#1c1b1b] flex items-center justify-center">
                    {project.cover_image_url ? (
                      <img src={project.cover_image_url} alt={project.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="material-symbols-outlined text-5xl text-stone-800 group-hover:text-stone-700 transition-colors">
                        precision_manufacturing
                      </span>
                    )}
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="font-headline font-bold text-[#e5e2e1] group-hover:text-[#ffb595] transition-colors tracking-tight truncate">
                        {project.name}
                      </h3>
                      <span className={`shrink-0 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 ${STATUS_COLORS[project.status]}`}>
                        {STATUS_LABELS[project.status]}
                      </span>
                    </div>
                    {project.subtitle && (
                      <p className="text-stone-500 text-xs line-clamp-2 mb-4 break-words">{project.subtitle}</p>
                    )}
                    <p className="text-[10px] text-stone-600 uppercase tracking-widest mt-auto">
                      {project.total_hours > 0 ? `${project.total_hours}h logged` : `Started ${project.created_at}`}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="bg-[#1c1b1b] ghost-border p-8">
          <div className="flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined text-[#ee671c]">favorite</span>
            <h2 className="text-2xl font-headline font-bold text-[#e5e2e1] tracking-tight">Kudos</h2>
          </div>

          {can_give_kudos && (
            <form onSubmit={submitKudo} className="mb-6">
              <textarea
                value={kudoContent}
                onChange={(e) => setKudoContent(e.target.value)}
                placeholder={`Give ${user.display_name} some kudos...`}
                rows={3}
                className="w-full bg-[#0e0e0e] border-none px-4 py-3 text-sm text-[#e5e2e1] focus:ring-1 focus:ring-[#ee671c]/30 placeholder:text-stone-600 resize-y mb-2"
              />
              <button
                type="submit"
                disabled={!kudoContent.trim()}
                className="signature-smolder text-[#4c1a00] px-5 py-2 text-xs font-bold uppercase tracking-[0.15em] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-base">favorite</span>
                Send Kudos
              </button>
            </form>
          )}

          {kudos.length === 0 ? (
            <p className="text-stone-500 text-sm">No kudos yet — keep building.</p>
          ) : (
            <div className="space-y-4">
              {kudos.map((kudo) => (
                <article key={kudo.id} className="bg-[#0e0e0e] ghost-border p-6 min-w-0 overflow-hidden">
                  <div className="flex items-start gap-3 mb-3">
                    <img src={kudo.author_avatar} alt={kudo.author_name} className="w-8 h-8 border border-white/10 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          href={`/users/${kudo.author_id}`}
                          className="font-headline font-bold text-[#e5e2e1] text-sm hover:text-[#ffb595] transition-colors"
                        >
                          {kudo.author_name}
                        </Link>
                        {kudo.author_is_staff && (
                          <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 bg-[#ee671c]/15 text-[#ee671c]">
                            Staff
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-stone-600">{kudo.created_at}</p>
                    </div>
                    {kudo.can_destroy && (
                      <button
                        onClick={() => deleteKudo(kudo.id)}
                        className="text-stone-600 hover:text-red-400 transition-colors shrink-0 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                    )}
                  </div>
                  <p className="text-stone-300 text-sm leading-relaxed whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
                    {kudo.content}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  )
}
