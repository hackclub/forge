import { useState } from 'react'
import { useForm, usePage } from '@inertiajs/react'
import type { HackatimeProject, ProjectForm, ProjectTier, SharedProps } from '@/types'

function formatHours(seconds: number) {
  const hours = seconds / 3600
  if (hours >= 10) return `${Math.round(hours)}h`
  if (hours >= 1) return `${hours.toFixed(1)}h`
  return `${Math.max(1, Math.round(seconds / 60))}m`
}

export default function ProjectsForm({
  project,
  title,
  submit_url,
  method,
  linkable_projects,
  hackatime_enabled,
}: {
  project: ProjectForm
  title: string
  submit_url: string
  method: string
  linkable_projects?: { id: number; name: string }[]
  hackatime_enabled?: boolean
}) {
  const { errors } = usePage<SharedProps>().props
  const [importUrl, setImportUrl] = useState('')
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState('')
  const [showImport, setShowImport] = useState(false)
  const [hackatimeProjects, setHackatimeProjects] = useState<HackatimeProject[] | null>(null)
  const [loadingHackatime, setLoadingHackatime] = useState(false)
  const [hackatimeError, setHackatimeError] = useState('')

  const isBuildReview = project.tier === 'tier_build_review' || !!project.build_review

  const form = useForm({
    name: project.name,
    subtitle: project.subtitle,
    repo_link: project.repo_link,
    tags: project.tags,
    tier: project.tier,
    devlog_mode: project.devlog_mode || '',
    linked_project_id: project.linked_project_id ?? '',
    uses_ai: project.uses_ai,
    ai_usage: project.ai_usage,
    hackatime_projects: project.hackatime_projects ?? [],
  })

  async function loadHackatimeProjects() {
    setHackatimeError('')
    setLoadingHackatime(true)
    try {
      const res = await fetch('/projects/hackatime_projects', { headers: { Accept: 'application/json' } })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error || 'Could not load your Hackatime projects.')

      setHackatimeProjects(body.projects ?? [])
    } catch (err) {
      setHackatimeError(err instanceof Error ? err.message : 'Could not load your Hackatime projects.')
    } finally {
      setLoadingHackatime(false)
    }
  }

  function toggleHackatimeProject(name: string) {
    const selected = form.data.hackatime_projects
    form.setData(
      'hackatime_projects',
      selected.includes(name) ? selected.filter((n) => n !== name) : [...selected, name],
    )
  }

  async function handleImport() {
    setImportError('')

    if (!importUrl.match(/github\.com\/[^/]+\/[^/]+/)) {
      setImportError('Enter a valid GitHub repository URL')
      return
    }

    setImporting(true)
    try {
      const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content
      const res = await fetch('/projects/import_from_github', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
        },
        body: JSON.stringify({ repo_url: importUrl }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Import failed')
      }

      const data = await res.json()

      form.setData({
        name: data.name || form.data.name,
        subtitle: form.data.subtitle,
        repo_link: data.repo_link || importUrl,
        tags: Array.isArray(data.tags) ? data.tags.slice(0, 5) : form.data.tags,
        tier: form.data.tier,
        devlog_mode: form.data.devlog_mode,
        uses_ai: form.data.uses_ai,
        ai_usage: form.data.ai_usage,
      })

      setShowImport(false)
      setImportUrl('')
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Could not import repository.')
    } finally {
      setImporting(false)
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (method === 'patch') {
      form.patch(submit_url)
    } else {
      form.post(submit_url)
    }
  }

  return (
    <div className="p-5 md:p-12 max-w-2xl mx-auto">
      <h1 className="text-4xl font-headline font-bold text-[#e5e2e1] tracking-tight mb-8">{title}</h1>

      {method === 'post' && !showImport && !isBuildReview && (
        <button
          type="button"
          onClick={() => setShowImport(true)}
          className="ghost-border bg-[#1c1b1b] hover:bg-[#2a2a2a] text-stone-400 hover:text-[#e5e2e1] px-5 py-3 text-xs font-bold uppercase tracking-[0.2em] transition-colors flex items-center gap-3 mb-8 w-full justify-center"
        >
          <span className="material-symbols-outlined text-lg">download</span>
          Import from GitHub
        </button>
      )}

      {showImport && (
        <div className="ghost-border bg-[#1c1b1b] p-6 mb-8 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-stone-500">Import from GitHub</span>
            <button
              type="button"
              onClick={() => {
                setShowImport(false)
                setImportError('')
              }}
              className="text-stone-600 hover:text-stone-400 transition-colors"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="url"
              value={importUrl}
              onChange={(e) => setImportUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleImport())}
              className="flex-1 bg-[#0e0e0e] border-none px-4 py-3 text-[#e5e2e1] focus:ring-1 focus:ring-[#ca5924]/30 placeholder:text-stone-600 text-sm min-w-0"
              placeholder="https://github.com/username/repo"
            />
            <button
              type="button"
              onClick={handleImport}
              disabled={importing}
              className="signature-smolder text-[#4c1a00] px-6 py-3 font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2"
            >
              {importing ? (
                <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
              ) : (
                'Import'
              )}
            </button>
          </div>
          {importError && (
            <p className="text-red-400 text-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">error</span>
              {importError}
            </p>
          )}
        </div>
      )}

      <form onSubmit={submit} className="space-y-6">
        {Object.keys(errors).length > 0 && (
          <div className="ghost-border bg-red-500/10 text-red-400 p-4 rounded-lg flex items-start gap-3">
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
          <label htmlFor="name" className="block text-xs font-bold uppercase tracking-[0.2em] text-stone-500 mb-2">
            Project Name
          </label>
          <input
            type="text"
            id="name"
            value={form.data.name}
            onChange={(e) => form.setData('name', e.target.value)}
            className="w-full bg-[#0e0e0e] border-none rounded-lg px-4 py-3 text-[#e5e2e1] focus:ring-1 focus:ring-[#ca5924]/30 placeholder:text-stone-600"
            placeholder="My Hardware Project"
            required
          />
        </div>

        <div>
          <label htmlFor="subtitle" className="block text-xs font-bold uppercase tracking-[0.2em] text-stone-500 mb-2">
            Subtitle
          </label>
          <input
            type="text"
            id="subtitle"
            value={form.data.subtitle}
            onChange={(e) => form.setData('subtitle', e.target.value)}
            className="w-full bg-[#0e0e0e] border-none rounded-lg px-4 py-3 text-[#e5e2e1] focus:ring-1 focus:ring-[#ca5924]/30 placeholder:text-stone-600"
            placeholder="A short description of your project"
          />
        </div>

        <div>
          <label htmlFor="repo_link" className="block text-xs font-bold uppercase tracking-[0.2em] text-stone-500 mb-2">
            Repository Link <span className="text-stone-600 normal-case tracking-normal">(optional)</span>
          </label>
          <input
            type="url"
            id="repo_link"
            value={form.data.repo_link}
            onChange={(e) => form.setData('repo_link', e.target.value)}
            className="w-full bg-[#0e0e0e] border-none rounded-lg px-4 py-3 text-[#e5e2e1] focus:ring-1 focus:ring-[#ca5924]/30 placeholder:text-stone-600"
            placeholder="https://github.com/..."
          />
        </div>

        {hackatime_enabled && (
          <div className="ghost-border bg-[#1c1b1b] p-5 space-y-3">
            <div>
              <span className="block text-xs font-bold uppercase tracking-[0.2em] text-stone-400">
                Hackatime Projects <span className="text-stone-600 normal-case tracking-normal">(optional)</span>
              </span>
              <span className="block text-stone-500 text-xs mt-1">
                Link the Hackatime projects you tracked time on. We find them from your Slack account — nothing to type
                in.
              </span>
            </div>

            {form.data.hackatime_projects.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.data.hackatime_projects.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => toggleHackatimeProject(name)}
                    className="flex items-center gap-1 bg-[#ca5924]/15 px-2 py-1 text-xs font-bold text-[#ffb595]"
                    title="Remove"
                  >
                    {name}
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                ))}
              </div>
            )}

            {hackatimeProjects === null ? (
              <button
                type="button"
                onClick={loadHackatimeProjects}
                disabled={loadingHackatime}
                className="flex items-center gap-2 bg-[#0e0e0e] px-4 py-2 text-xs font-bold uppercase tracking-wider text-stone-300 ghost-border transition-colors hover:text-[#ffb595] disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-base">schedule</span>
                {loadingHackatime ? 'Loading…' : 'Find my Hackatime projects'}
              </button>
            ) : hackatimeProjects.length === 0 ? (
              <p className="text-stone-500 text-xs">No Hackatime projects found on your account yet.</p>
            ) : (
              <div className="max-h-64 overflow-y-auto space-y-1">
                {hackatimeProjects.map((p) => (
                  <label
                    key={p.name}
                    className="flex cursor-pointer items-center gap-3 bg-[#0e0e0e] px-3 py-2 hover:bg-[#161616]"
                  >
                    <input
                      type="checkbox"
                      checked={form.data.hackatime_projects.includes(p.name)}
                      onChange={() => toggleHackatimeProject(p.name)}
                      className="size-4 accent-[#ca5924] shrink-0"
                    />
                    <span className="min-w-0 flex-1 truncate text-sm text-[#e5e2e1]">{p.name}</span>
                    {p.languages.length > 0 && (
                      <span className="hidden truncate text-[10px] uppercase tracking-wider text-stone-600 sm:block">
                        {p.languages.slice(0, 3).join(' · ')}
                      </span>
                    )}
                    <span className="shrink-0 text-xs font-bold tabular-nums text-[#e3b24c]">
                      {formatHours(p.seconds)}
                    </span>
                  </label>
                ))}
              </div>
            )}

            {hackatimeError && <p className="text-red-400 text-xs">{hackatimeError}</p>}
          </div>
        )}

        <div className="ghost-border bg-[#1c1b1b] p-5 space-y-3">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.data.uses_ai}
              onChange={(e) => form.setData('uses_ai', e.target.checked)}
              className="mt-1 size-4 accent-[#ca5924] shrink-0"
            />
            <span>
              <span className="block text-xs font-bold uppercase tracking-[0.2em] text-stone-400">Made with AI</span>
              <span className="block text-stone-500 text-xs mt-1 normal-case tracking-normal">
                Declare this if AI was more than ~20% of your project. It just adds a transparency badge — no penalty.
              </span>
            </span>
          </label>
          {form.data.uses_ai && (
            <div>
              <label
                htmlFor="ai_usage"
                className="block text-xs font-bold uppercase tracking-[0.2em] text-stone-500 mb-2"
              >
                What did you use AI for?
              </label>
              <textarea
                id="ai_usage"
                value={form.data.ai_usage}
                onChange={(e) => form.setData('ai_usage', e.target.value)}
                rows={3}
                className="w-full bg-[#0e0e0e] border-none rounded-lg px-4 py-3 text-[#e5e2e1] focus:ring-1 focus:ring-[#ca5924]/30 placeholder:text-stone-600"
                placeholder="e.g. generated boilerplate firmware, helped debug the PCB layout, wrote docs…"
              />
            </div>
          )}
        </div>

        {isBuildReview && method === 'post' && (
          <div>
            <label
              htmlFor="linked_project_id"
              className="block text-xs font-bold uppercase tracking-[0.2em] text-stone-500 mb-2"
            >
              Link to Existing Project <span className="text-stone-600 normal-case tracking-normal">(optional)</span>
            </label>
            <select
              id="linked_project_id"
              value={form.data.linked_project_id ?? ''}
              onChange={(e) => form.setData('linked_project_id', e.target.value)}
              className="w-full bg-[#0e0e0e] border-none rounded-lg px-4 py-3 text-[#e5e2e1] focus:ring-1 focus:ring-[#ca5924]/30"
            >
              <option value="">— None (non forge project) —</option>
              {(linkable_projects || []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <p className="text-stone-600 text-xs mt-2">
              Only approved Forge projects of yours without an existing build review are listed. Approving this build
              review will mark the linked project as built.
            </p>
          </div>
        )}

        {method === 'patch' && form.data.tier !== 'tier_1' && (
          <div>
            <label htmlFor="tier" className="block text-xs font-bold uppercase tracking-[0.2em] text-stone-500 mb-2">
              Tier
            </label>
            <select
              id="tier"
              value={form.data.tier}
              onChange={(e) => form.setData('tier', e.target.value as ProjectTier)}
              className="w-full bg-[#0e0e0e] border-none rounded-lg px-4 py-3 text-[#e5e2e1] focus:ring-1 focus:ring-[#ca5924]/30"
            >
              <option value="tier_4">Tier 4 - 4.5c/hr (Basic, $0–50)</option>
              <option value="tier_3">Tier 3 - 5.0c/hr (Standard, $0–100)</option>
              <option value="tier_2">Tier 2 - 6.5c/hr (Bigger, $0–200)</option>
            </select>
            <p className="text-stone-600 text-xs mt-2">
              Higher tiers earn more coins per hour but are expected to be more ambitious.
            </p>
          </div>
        )}

        {method === 'patch' && (
          <div>
            <label
              htmlFor="devlog_mode"
              className="block text-xs font-bold uppercase tracking-[0.2em] text-stone-500 mb-2"
            >
              Devlog Method
            </label>
            <select
              id="devlog_mode"
              value={form.data.devlog_mode}
              onChange={(e) => form.setData('devlog_mode', e.target.value)}
              className="w-full bg-[#0e0e0e] border-none rounded-lg px-4 py-3 text-[#e5e2e1] focus:ring-1 focus:ring-[#ca5924]/30"
            >
              <option value="">Not chosen</option>
              <option value="git">Git Journal</option>
              <option value="website">Web Devlog</option>
            </select>
            <p className="text-stone-600 text-xs mt-2">Switching modes won't delete existing devlog entries.</p>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            className="signature-smolder text-[#4c1a00] px-8 py-3 rounded-lg font-headline font-bold uppercase tracking-wider active:scale-95 transition-transform flex items-center gap-2"
            disabled={form.processing}
          >
            {form.processing ? (
              <>
                <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
                Saving...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-lg">save</span>
                Save Project
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
