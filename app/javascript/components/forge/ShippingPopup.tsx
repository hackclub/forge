import { useState } from 'react'
import { Link, router } from '@inertiajs/react'
import { STATUS_COLORS, STATUS_LABELS, type DashboardProject } from './projectStatus'
import FireIcon from '@/components/FireIcon'

interface ShippingPopupProps {
  projects: DashboardProject[]
  onClose: () => void
}

export default function ShippingPopup({ projects, onClose }: ShippingPopupProps) {
  const [selectedId, setSelectedId] = useState<number | null>(null)

  function handleShip() {
    if (selectedId === null) return
    onClose()
    router.visit(`/projects/${selectedId}/ai_check`)
  }

  if (projects.length === 0) {
    return (
      <div className="py-10 text-center">
        <FireIcon className="mb-3 block text-5xl mx-auto" />
        <p className="mb-1 font-headline text-lg text-[#e5e2e1]">Nothing to ship yet</p>
        <p className="mb-6 text-sm text-stone-500">Forge a project first, then bring it to the furnace.</p>
        <Link
          href="/projects/new"
          className="signature-smolder corner-accents inline-flex items-center gap-2 px-6 py-3 font-headline text-xs font-bold uppercase tracking-wider text-[#4c1a00]"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          New Project
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-stone-400">Which project would you like to ship into the fire?</p>

      <div className="max-h-[52vh] space-y-2.5 overflow-y-auto pr-1">
        {projects.map((project) => {
          const selected = project.id === selectedId
          return (
            <button
              key={project.id}
              type="button"
              onClick={() => setSelectedId(project.id)}
              aria-pressed={selected}
              className={`flex w-full items-center gap-3 p-2.5 text-left ghost-border transition-colors ${
                selected ? 'bg-[#ca5924]/15 text-[#ffb595]' : 'bg-[#0e0e0e] text-stone-300 hover:bg-[#161616]'
              }`}
            >
              <img
                src={project.cover_image_url || '/orph-building.png'}
                alt=""
                className="h-12 w-12 shrink-0 bg-[#1c1b1b] object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-headline font-bold tracking-tight">{project.name}</p>
                {project.subtitle && <p className="truncate text-xs text-stone-500">{project.subtitle}</p>}
              </div>
              <span
                className={`shrink-0 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${STATUS_COLORS[project.status]}`}
              >
                {STATUS_LABELS[project.status]}
              </span>
              <span
                className={`material-symbols-outlined shrink-0 text-xl ${selected ? 'text-[#ca5924]' : 'text-stone-700'}`}
                style={selected ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {selected ? 'check_circle' : 'radio_button_unchecked'}
              </span>
            </button>
          )
        })}
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-white/5 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="cursor-pointer px-3 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500 transition-colors hover:text-[#ffb595]"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleShip}
          disabled={selectedId === null}
          className="signature-smolder corner-accents inline-flex cursor-pointer items-center gap-2 px-6 py-3 font-headline text-xs font-bold uppercase tracking-wider text-[#4c1a00] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <FireIcon className="text-base" />
          Ship it
        </button>
      </div>
    </div>
  )
}
