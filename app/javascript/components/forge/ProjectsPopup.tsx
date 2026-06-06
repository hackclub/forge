import { Link } from '@inertiajs/react'
import { STATUS_COLORS, STATUS_LABELS, type DashboardProject } from './projectStatus'

interface OrphMotivation {
  approved_count: number
  goal: number
  dino_image: string
}

interface ProjectsPopupProps {
  projects: DashboardProject[]
  quest: OrphMotivation
}

function QuestBanner({ quest }: { quest: OrphMotivation }) {
  const progress = Math.min(100, (quest.approved_count / quest.goal) * 100)
  const reached = quest.approved_count >= quest.goal
  return (
    <div className="flex items-center gap-4 bg-[#0e0e0e] p-4 ghost-border">
      <img src={quest.dino_image} alt="Orph" className="h-14 w-14 shrink-0 object-contain" />
      <div className="min-w-0 flex-1">
        <span className="mb-1 inline-flex items-center gap-1 bg-[#ca5924]/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#ffb595]">
          <span className="material-symbols-outlined text-[11px]">flag</span>
          Community Quest
        </span>
        <p className="mb-1.5 font-headline text-sm font-bold text-[#e5e2e1]">
          {reached ? 'The forge did it — Orph is grinning again!' : 'Help cheer Orph up — 100 projects, together'}
        </p>
        <div className="h-2 overflow-hidden bg-[#1c1b1b] ghost-border">
          <div className="signature-smolder h-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        <div className="mt-1 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.2em]">
          <span className="text-stone-500">
            {quest.approved_count} / {quest.goal} projects
          </span>
          <span className="text-[#ffb595]">{Math.floor(progress)}%</span>
        </div>
      </div>
    </div>
  )
}

export default function ProjectsPopup({ projects, quest }: ProjectsPopupProps) {
  return (
    <div className="space-y-5">
      <QuestBanner quest={quest} />

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-stone-400">Your builds, fresh from the forge.</p>
        <Link
          href="/projects/new"
          className="signature-smolder corner-accents inline-flex shrink-0 items-center gap-2 px-4 py-2 font-headline text-xs font-bold uppercase tracking-wider text-[#4c1a00]"
        >
          <span className="material-symbols-outlined text-base">add</span>
          New Project
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="p-12 text-center">
          <span
            className="material-symbols-outlined mb-4 block text-6xl text-[#ca5924]"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            precision_manufacturing
          </span>
          <p className="mb-2 font-headline text-lg font-medium text-stone-300">No projects yet</p>
          <p className="mb-6 text-sm text-stone-500">Start a project to begin your build.</p>
          <Link
            href="/projects/new"
            className="signature-smolder corner-accents inline-flex items-center gap-2 px-6 py-3 font-headline text-xs font-bold uppercase tracking-wider text-[#4c1a00]"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            Create Your First Project
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="group flex flex-col bg-[#0e0e0e] ghost-border transition-colors hover:bg-[#161616]"
            >
              <div className="aspect-[16/10] overflow-hidden bg-[#1c1b1b]">
                <img
                  src={project.cover_image_url || '/orph-building.png'}
                  alt={project.name}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex flex-1 flex-col p-4">
                <div className="mb-2 flex items-start justify-between gap-3">
                  <h3 className="truncate font-headline font-bold tracking-tight text-[#e5e2e1] transition-colors group-hover:text-[#ffb595]">
                    {project.name}
                  </h3>
                  <span
                    className={`shrink-0 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${STATUS_COLORS[project.status]}`}
                  >
                    {STATUS_LABELS[project.status]}
                  </span>
                </div>
                {project.subtitle && <p className="mb-4 line-clamp-2 text-xs text-stone-500">{project.subtitle}</p>}
                <p className="mt-auto text-[10px] uppercase tracking-widest text-stone-600">
                  Updated {project.updated_at}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
