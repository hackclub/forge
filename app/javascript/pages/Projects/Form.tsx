import { useState } from 'react'
import { useForm, usePage } from '@inertiajs/react'
import type { ProjectForm, ProjectTier, SharedProps } from '@/types'
import { tierCoinRate } from '@/lib/tiers'
import HackatimePicker from '@/components/HackatimePicker'

function GitHubMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden="true">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  )
}

function MacondoWordmark({ className }: { className?: string }) {
  return (
    <span
      className={className}
      style={{
        fontFamily: "'Are You Serious', cursive",
        color: 'rgb(253, 224, 71)',
        textShadow: '0 1px 2px rgba(0, 0, 0, 0.55)',
      }}
    >
      Macondo
    </span>
  )
}

export default function ProjectsForm({
  project,
  title,
  submit_url,
  method,
  linkable_projects,
  hackatime_enabled,
  macondo_enabled,
}: {
  project: ProjectForm
  title: string
  submit_url: string
  method: string
  linkable_projects?: { id: number; name: string }[]
  hackatime_enabled?: boolean
  macondo_enabled?: boolean
}) {
  const { errors } = usePage<SharedProps>().props
  const [importUrl, setImportUrl] = useState('')
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState('')
  const [showImport, setShowImport] = useState(false)
  const [macondoUrl, setMacondoUrl] = useState('')
  const [macondoImporting, setMacondoImporting] = useState(false)
  const [macondoError, setMacondoError] = useState('')
  const [showMacondoImport, setShowMacondoImport] = useState(false)
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
    macondo_project_id: '',
  })

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

  async function handleMacondoImport() {
    setMacondoError('')

    if (!macondoUrl.match(/macondo\.hackclub\.com\/projects\/[^/?#]+/)) {
      setMacondoError('Enter a valid Macondo project URL')
      return
    }

    setMacondoImporting(true)
    try {
      const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content
      const res = await fetch('/projects/import_from_macondo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
        },
        body: JSON.stringify({ url: macondoUrl }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Import failed')
      }

      const data = await res.json()

      form.setData({
        ...form.data,
        name: data.name || form.data.name,
        repo_link: data.repo_link || form.data.repo_link,
        hackatime_projects: Array.isArray(data.hackatime_projects)
          ? data.hackatime_projects
          : form.data.hackatime_projects,
        macondo_project_id: data.macondo_project_id || '',
      })

      setShowMacondoImport(false)
      setMacondoUrl('')
    } catch (err) {
      setMacondoError(err instanceof Error ? err.message : 'Could not import project.')
    } finally {
      setMacondoImporting(false)
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

      {method === 'post' && !isBuildReview && (!showImport || (macondo_enabled && !showMacondoImport)) && (
        <div className="space-y-3 mb-8">
          {!showImport && (
            <button
              type="button"
              onClick={() => setShowImport(true)}
              className="border border-[#30363d] bg-[#181717] hover:bg-[#2b3137] text-white px-5 h-12 text-xs font-bold uppercase tracking-[0.2em] transition-colors flex items-center gap-3 w-full justify-center"
            >
              <GitHubMark className="size-4 fill-current shrink-0" />
              Import from GitHub
            </button>
          )}
          {macondo_enabled && !showMacondoImport && (
            <button
              type="button"
              onClick={() => setShowMacondoImport(true)}
              className="border border-[#684d3a]/40 bg-[#eacfb3] hover:bg-[#e2c19e] text-[#684d3a] px-5 h-12 text-xs font-bold uppercase tracking-[0.2em] transition-colors flex items-center gap-3 w-full justify-center"
            >
              <span className="material-symbols-outlined text-lg">download</span>
              <span>
                Import from <MacondoWordmark className="normal-case tracking-normal text-xl align-baseline" />
              </span>
            </button>
          )}
        </div>
      )}

      {showImport && (
        <div className="ghost-border bg-[#1c1b1b] p-6 mb-8 space-y-4">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-white">
              <GitHubMark className="size-4 fill-current shrink-0" />
              Import from GitHub
            </span>
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

      {showMacondoImport && (
        <div className="ghost-border bg-[#1c1b1b] p-6 mb-8 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-stone-500">
              Import from <MacondoWordmark className="normal-case tracking-normal text-lg align-baseline" />
            </span>
            <button
              type="button"
              onClick={() => {
                setShowMacondoImport(false)
                setMacondoError('')
              }}
              className="text-stone-600 hover:text-stone-400 transition-colors"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="url"
              value={macondoUrl}
              onChange={(e) => setMacondoUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleMacondoImport())}
              className="flex-1 bg-[#0e0e0e] border-none px-4 py-3 text-[#e5e2e1] focus:ring-1 focus:ring-[#ca5924]/30 placeholder:text-stone-600 text-sm min-w-0"
              placeholder="https://macondo.hackclub.com/projects/..."
            />
            <button
              type="button"
              onClick={handleMacondoImport}
              disabled={macondoImporting}
              className="signature-smolder text-[#4c1a00] px-6 py-3 font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2"
            >
              {macondoImporting ? (
                <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
              ) : (
                'Import'
              )}
            </button>
          </div>
          <p className="text-stone-600 text-xs">Open your project in a new tab and copy that URL</p>
          {macondoError && (
            <p className="text-red-400 text-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">error</span>
              {macondoError}
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
                Link the Hackatime projects you tracked time on!
              </span>
            </div>
            <HackatimePicker
              selected={form.data.hackatime_projects}
              onChange={(names) => form.setData('hackatime_projects', names)}
            />
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
              <option value="tier_4">Tier 4 - {tierCoinRate('tier_4')} (Basic, $0–50)</option>
              <option value="tier_3">Tier 3 - {tierCoinRate('tier_3')} (Standard, $0–100)</option>
              <option value="tier_2">Tier 2 - {tierCoinRate('tier_2')} (Bigger, $0–200)</option>
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
