import { useState } from 'react'
import { useForm, usePage } from '@inertiajs/react'
import type { ProjectForm, SharedProps } from '@/types'

export default function ProjectsForm({
  project,
  title,
  submit_url,
  method,
}: {
  project: ProjectForm
  title: string
  submit_url: string
  method: string
}) {
  const { errors } = usePage<SharedProps>().props
  const [importUrl, setImportUrl] = useState('')
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState('')
  const [showImport, setShowImport] = useState(false)

  const form = useForm({
    name: project.name,
    subtitle: project.subtitle,
    repo_link: project.repo_link,
    tags: project.tags,
    tier: project.tier,
    devlog_mode: project.devlog_mode || '',
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
          'Accept': 'application/json',
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

      {method === 'post' && !showImport && (
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
            <button type="button" onClick={() => { setShowImport(false); setImportError('') }} className="text-stone-600 hover:text-stone-400 transition-colors">
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="url"
              value={importUrl}
              onChange={(e) => setImportUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleImport())}
              className="flex-1 bg-[#0e0e0e] border-none px-4 py-3 text-[#e5e2e1] focus:ring-1 focus:ring-[#ee671c]/30 placeholder:text-stone-600 text-sm min-w-0"
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
            className="w-full bg-[#0e0e0e] border-none rounded-lg px-4 py-3 text-[#e5e2e1] focus:ring-1 focus:ring-[#ee671c]/30 placeholder:text-stone-600"
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
            className="w-full bg-[#0e0e0e] border-none rounded-lg px-4 py-3 text-[#e5e2e1] focus:ring-1 focus:ring-[#ee671c]/30 placeholder:text-stone-600"
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
            className="w-full bg-[#0e0e0e] border-none rounded-lg px-4 py-3 text-[#e5e2e1] focus:ring-1 focus:ring-[#ee671c]/30 placeholder:text-stone-600"
            placeholder="https://github.com/..."
          />
        </div>

        {method === 'patch' && form.data.tier !== 'tier_1' && (
          <div>
            <label htmlFor="tier" className="block text-xs font-bold uppercase tracking-[0.2em] text-stone-500 mb-2">
              Tier
            </label>
            <select
              id="tier"
              value={form.data.tier}
              onChange={(e) => form.setData('tier', e.target.value)}
              className="w-full bg-[#0e0e0e] border-none rounded-lg px-4 py-3 text-[#e5e2e1] focus:ring-1 focus:ring-[#ee671c]/30"
            >
              <option value="tier_4">Tier 4 — 4c/hr (Basic, $0–50)</option>
              <option value="tier_3">Tier 3 — 4.5c/hr (Standard, $0–100)</option>
              <option value="tier_2">Tier 2 — 5.5c/hr (Bigger, $0–200)</option>
            </select>
            <p className="text-stone-600 text-xs mt-2">Higher tiers earn more coins per hour but are expected to be more ambitious.</p>
          </div>
        )}

        {method === 'patch' && (
          <div>
            <label htmlFor="devlog_mode" className="block text-xs font-bold uppercase tracking-[0.2em] text-stone-500 mb-2">
              Devlog Method
            </label>
            <select
              id="devlog_mode"
              value={form.data.devlog_mode}
              onChange={(e) => form.setData('devlog_mode', e.target.value)}
              className="w-full bg-[#0e0e0e] border-none rounded-lg px-4 py-3 text-[#e5e2e1] focus:ring-1 focus:ring-[#ee671c]/30"
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
