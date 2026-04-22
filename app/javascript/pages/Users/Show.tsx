import { useState } from 'react'
import { Head, Link, router } from '@inertiajs/react'
import type { ProjectStatus } from '@/types'

interface ProfileUser {
  id: number
  display_name: string
  avatar: string
  joined_at: string
  github_username: string | null
  git_provider: string
  git_instance_url: string | null
}

interface ProfileStats {
  total_hours: number
  projects_count: number
  approved_count: number
  built_count: number
  kudos_count: number
  current_streak: number
  longest_streak: number
  last_active_on: string | null
  streak_multiplier: number
  next_streak_milestone: number | null
  next_streak_multiplier: number | null
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
  project_id: number | null
  project_name: string | null
}

interface Props {
  user: ProfileUser
  stats: ProfileStats
  projects: ProfileProject[]
  kudos: ProfileKudo[]
  can_give_kudos: boolean
  can_edit_profile: boolean
}

const STATUS_LABELS: Record<ProjectStatus, string> = {
  draft: 'Draft',
  pending: 'Pending',
  approved: 'Shipped',
  returned: 'Returned',
  rejected: 'Rejected',
  pitch_approved: 'Building',
  pitch_pending: 'Pitch Review',
}

const STATUS_COLORS: Record<ProjectStatus, string> = {
  draft: 'bg-stone-500/15 text-stone-400',
  pending: 'bg-amber-500/15 text-amber-400',
  approved: 'bg-emerald-500/15 text-emerald-400',
  returned: 'bg-orange-500/15 text-orange-400',
  rejected: 'bg-red-500/15 text-red-400',
  pitch_approved: 'bg-emerald-500/15 text-emerald-400',
  pitch_pending: 'bg-amber-500/15 text-amber-400',
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

const GIT_PROVIDERS: Record<string, { label: string; baseUrl: string }> = {
  github: { label: 'GitHub', baseUrl: 'https://github.com' },
  gitlab: { label: 'GitLab', baseUrl: 'https://gitlab.com' },
  codeberg: { label: 'Codeberg', baseUrl: 'https://codeberg.org' },
  gitea: { label: 'Gitea', baseUrl: '' },
}

function gitProfileUrl(user: ProfileUser): string {
  const provider = GIT_PROVIDERS[user.git_provider] || GIT_PROVIDERS.github
  const base = user.git_provider === 'gitea' && user.git_instance_url ? user.git_instance_url.replace(/\/+$/, '') : provider.baseUrl
  return `${base}/${user.github_username}`
}

function gitAvatarUrl(user: ProfileUser): string | null {
  const base = user.git_provider === 'gitea' && user.git_instance_url
    ? user.git_instance_url.replace(/\/+$/, '')
    : GIT_PROVIDERS[user.git_provider]?.baseUrl
  if (!base) return null
  return `${base}/${user.github_username}.png?size=120`
}

export default function UsersShow({ user, stats, projects, kudos, can_give_kudos, can_edit_profile }: Props) {
  const [kudoContent, setKudoContent] = useState('')
  const [editingGithub, setEditingGithub] = useState(false)
  const [githubInput, setGithubInput] = useState(user.github_username || '')
  const [providerInput, setProviderInput] = useState(user.git_provider || 'github')
  const [instanceUrlInput, setInstanceUrlInput] = useState(user.git_instance_url || '')

  function saveGithub(e: React.FormEvent) {
    e.preventDefault()
    router.patch(`/users/${user.id}/github`, {
      github_username: githubInput.trim(),
      git_provider: providerInput,
      git_instance_url: providerInput === 'gitea' ? instanceUrlInput.trim() : '',
    }, {
      onSuccess: () => setEditingGithub(false),
    })
  }

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
      <div className="p-5 md:p-12 max-w-6xl mx-auto space-y-10">
        <section className="bg-[#1c1b1b] ghost-border p-5 md:p-8 flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
          <img
            src={user.avatar}
            alt={user.display_name}
            className="w-24 h-24 border border-white/10 shrink-0"
          />
          <div className="min-w-0 flex-1">
            <h1 className="text-4xl font-headline font-bold text-[#e5e2e1] tracking-tight break-words">
              {user.display_name}
            </h1>
            <p className="text-stone-500 text-sm mt-2">Forging since {user.joined_at}</p>
          </div>
          <div
            className={`flex items-center gap-3 px-5 py-3 ghost-border shrink-0 ${stats.current_streak > 0 ? 'bg-[#ee671c]/10' : 'bg-[#0e0e0e]'}`}
            title={stats.current_streak > 0 ? `Active ${stats.current_streak} ${stats.current_streak === 1 ? 'day' : 'days'} in a row` : 'No current streak'}
          >
            <span className={`material-symbols-outlined text-3xl ${stats.current_streak > 0 ? 'text-[#ee671c]' : 'text-stone-600'}`}>local_fire_department</span>
            <div className="text-left">
              <p className={`text-2xl font-headline font-bold leading-none ${stats.current_streak > 0 ? 'text-[#ffb595]' : 'text-stone-500'}`}>
                {stats.current_streak}
              </p>
              <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-500 mt-1">
                {stats.current_streak === 1 ? 'Day streak' : 'Day streak'}
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500 font-headline mb-4">Streak</h2>
          <div className="bg-[#1c1b1b] ghost-border p-6 mb-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 flex items-center justify-center ${stats.current_streak > 0 ? 'bg-[#ee671c]/15' : 'bg-stone-500/10'}`}>
                  <span className={`material-symbols-outlined text-3xl ${stats.current_streak > 0 ? 'text-[#ee671c]' : 'text-stone-600'}`}>local_fire_department</span>
                </div>
                <div>
                  <p className="text-4xl font-headline font-bold text-[#e5e2e1] tracking-tight leading-none">
                    {stats.current_streak}
                    <span className="text-stone-600 text-lg ml-2">{stats.current_streak === 1 ? 'day' : 'days'}</span>
                  </p>
                  <p className="text-stone-500 text-xs mt-1">Current streak</p>
                </div>
              </div>
              <div className="flex gap-6 text-sm">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-600">Multiplier</p>
                  <p className={`font-headline font-bold ${stats.streak_multiplier > 1 ? 'text-[#ffb595]' : 'text-[#e5e2e1]'}`}>
                    {stats.streak_multiplier.toFixed(2)}×
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-600">Longest</p>
                  <p className="text-[#e5e2e1] font-headline font-bold">{stats.longest_streak} {stats.longest_streak === 1 ? 'day' : 'days'}</p>
                </div>
                {stats.last_active_on && (
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-600">Last active</p>
                    <p className="text-[#e5e2e1] font-headline font-bold">{stats.last_active_on}</p>
                  </div>
                )}
              </div>
            </div>

            {stats.next_streak_milestone && stats.next_streak_multiplier && (
              <div className="mt-5 pt-5 border-t border-white/5">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-500">
                    Next tier at {stats.next_streak_milestone} {stats.next_streak_milestone === 1 ? 'day' : 'days'}
                  </p>
                  <span className="text-[#ffb595] text-xs font-bold font-headline flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">trending_up</span>
                    {stats.next_streak_multiplier.toFixed(2)}× payout
                  </span>
                </div>
                <div className="h-1.5 bg-[#0e0e0e] overflow-hidden">
                  <div
                    className="h-full signature-smolder transition-all"
                    style={{ width: `${Math.min(100, (stats.current_streak / stats.next_streak_milestone) * 100)}%` }}
                  />
                </div>
                <p className="text-stone-600 text-[10px] mt-2">
                  {stats.next_streak_milestone - stats.current_streak} {stats.next_streak_milestone - stats.current_streak === 1 ? 'day' : 'days'} to go — keep the streak alive to boost project payouts.
                </p>
              </div>
            )}
          </div>

          <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500 font-headline mb-4">Achievements</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <StatTile label="Hours" value={stats.total_hours} icon="schedule" />
            <StatTile label="Projects" value={stats.projects_count} icon="folder_open" />
            <StatTile label="Approved" value={stats.approved_count} icon="verified" />
            <StatTile label="Built" value={stats.built_count} icon="build" />
            <StatTile label="Kudos" value={stats.kudos_count} icon="favorite" />
          </div>
        </section>

        {(user.github_username || can_edit_profile) && (
          <section>
            <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500 font-headline mb-4">Git Profile</h2>
            <div className="bg-[#1c1b1b] ghost-border p-6">
              {editingGithub ? (
                <form onSubmit={saveGithub} className="space-y-3">
                  <div className="flex gap-3 flex-wrap">
                    <select
                      value={providerInput}
                      onChange={(e) => setProviderInput(e.target.value)}
                      className="bg-[#0e0e0e] border-none px-4 py-3 text-[#e5e2e1] text-sm focus:ring-1 focus:ring-[#ee671c]/30 cursor-pointer"
                    >
                      {Object.entries(GIT_PROVIDERS).map(([key, { label }]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={githubInput}
                      onChange={(e) => setGithubInput(e.target.value)}
                      placeholder="username"
                      autoFocus
                      className="flex-1 bg-[#0e0e0e] border-none px-4 py-3 text-[#e5e2e1] text-sm font-mono focus:ring-1 focus:ring-[#ee671c]/30 placeholder:text-stone-700 min-w-0"
                    />
                  </div>
                  {providerInput === 'gitea' && (
                    <input
                      type="url"
                      value={instanceUrlInput}
                      onChange={(e) => setInstanceUrlInput(e.target.value)}
                      placeholder="https://gitea.example.com"
                      className="w-full bg-[#0e0e0e] border-none px-4 py-3 text-[#e5e2e1] text-sm font-mono focus:ring-1 focus:ring-[#ee671c]/30 placeholder:text-stone-700"
                    />
                  )}
                  <div className="flex gap-2">
                    <button type="submit" className="signature-smolder text-[#4c1a00] px-5 py-3 text-xs font-bold uppercase tracking-wider cursor-pointer">
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingGithub(false)
                        setGithubInput(user.github_username || '')
                        setProviderInput(user.git_provider || 'github')
                        setInstanceUrlInput(user.git_instance_url || '')
                      }}
                      className="ghost-border text-stone-400 px-5 py-3 text-xs font-bold uppercase tracking-wider hover:text-[#e5e2e1] transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : user.github_username ? (
                <div className="flex items-center gap-4">
                  {gitAvatarUrl(user) ? (
                    <img src={gitAvatarUrl(user)!} alt={user.github_username} className="w-14 h-14 border border-white/10 shrink-0" />
                  ) : (
                    <div className="w-14 h-14 bg-[#0e0e0e] border border-white/10 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-stone-600 text-2xl">code</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <a
                      href={gitProfileUrl(user)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-headline font-bold text-[#e5e2e1] hover:text-[#ffb595] transition-colors text-lg flex items-center gap-2"
                    >
                      @{user.github_username}
                      <span className="material-symbols-outlined text-sm">open_in_new</span>
                    </a>
                    <p className="text-stone-500 text-xs font-mono truncate">
                      {GIT_PROVIDERS[user.git_provider]?.label || 'GitHub'}
                      {user.git_provider === 'gitea' && user.git_instance_url && ` · ${user.git_instance_url.replace(/^https?:\/\//, '')}`}
                    </p>
                  </div>
                  {can_edit_profile && (
                    <button
                      onClick={() => setEditingGithub(true)}
                      className="text-stone-500 hover:text-[#ffb595] transition-colors shrink-0 cursor-pointer"
                    >
                      <span className="material-symbols-outlined">edit</span>
                    </button>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setEditingGithub(true)}
                  className="flex items-center gap-3 text-stone-500 hover:text-[#ffb595] transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-2xl">add</span>
                  <span className="text-sm">Link your git profile</span>
                </button>
              )}
            </div>
          </section>
        )}

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
                  <div className="aspect-[16/10] overflow-hidden bg-[#1c1b1b]">
                    <img
                      src={project.cover_image_url || '/orph-building.png'}
                      alt={project.name}
                      className="w-full h-full object-cover"
                    />
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
                        {kudo.project_id && kudo.project_name && (
                          <>
                            <span className="text-stone-600 text-xs">on</span>
                            <Link
                              href={`/projects/${kudo.project_id}`}
                              className="text-[#ffb595] hover:text-[#ee671c] transition-colors text-sm font-headline font-bold"
                            >
                              {kudo.project_name}
                            </Link>
                          </>
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
