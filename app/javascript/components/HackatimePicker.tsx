import { useState } from 'react'
import type { HackatimeProject } from '@/types'

function formatHours(seconds: number) {
  const hours = seconds / 3600
  if (hours >= 10) return `${Math.round(hours)}h`
  if (hours >= 1) return `${hours.toFixed(1)}h`
  return `${Math.max(1, Math.round(seconds / 60))}m`
}

export default function HackatimePicker({
  selected,
  onChange,
}: {
  selected: string[]
  onChange: (names: string[]) => void
}) {
  const [projects, setProjects] = useState<HackatimeProject[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('')

  const visible = (projects ?? []).filter((p) => p.name.toLowerCase().includes(filter.trim().toLowerCase()))

  async function load() {
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/projects/hackatime_projects', { headers: { Accept: 'application/json' } })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error || 'Could not load your Hackatime projects.')

      setProjects(body.projects ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load your Hackatime projects.')
    } finally {
      setLoading(false)
    }
  }

  function toggle(name: string) {
    onChange(selected.includes(name) ? selected.filter((n) => n !== name) : [...selected, name])
  }

  return (
    <div className="space-y-3">
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => toggle(name)}
              className="flex items-center gap-1 bg-[#ca5924]/15 px-2 py-1 text-xs font-bold text-[#ffb595]"
              title="Remove"
            >
              {name}
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          ))}
        </div>
      )}

      {projects === null ? (
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 bg-[#0e0e0e] px-4 py-2 text-xs font-bold uppercase tracking-wider text-stone-300 ghost-border transition-colors hover:text-[#ffb595] disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-base">schedule</span>
          {loading ? 'Loading…' : 'Find my Hackatime projects'}
        </button>
      ) : projects.length === 0 ? (
        <p className="text-stone-500 text-xs">No Hackatime projects found on your account yet.</p>
      ) : (
        <>
          <input
            type="search"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder={`Search ${projects.length} projects…`}
            className="w-full bg-[#0e0e0e] border-none rounded-lg px-3 py-2 text-sm text-[#e5e2e1] focus:ring-1 focus:ring-[#ca5924]/30 placeholder:text-stone-600"
          />
          <div className="max-h-64 overflow-y-auto space-y-1">
            {visible.length === 0 && <p className="text-stone-500 text-xs py-2">No projects match “{filter}”.</p>}
            {visible.map((p) => (
              <label
                key={p.name}
                className="flex cursor-pointer items-center gap-3 bg-[#0e0e0e] px-3 py-2 hover:bg-[#161616]"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(p.name)}
                  onChange={() => toggle(p.name)}
                  className="size-4 accent-[#ca5924] shrink-0"
                />
                <span className="min-w-0 flex-1 truncate text-sm text-[#e5e2e1]">{p.name}</span>
                {p.languages.length > 0 && (
                  <span className="hidden truncate text-[10px] uppercase tracking-wider text-stone-600 sm:block">
                    {p.languages.slice(0, 3).join(' · ')}
                  </span>
                )}
                <span className="shrink-0 text-xs font-bold tabular-nums text-[#e3b24c]">{formatHours(p.seconds)}</span>
              </label>
            ))}
          </div>
        </>
      )}

      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  )
}
