import { Link } from '@inertiajs/react'

export default function ProjectsNew() {
  return (
    <div className="p-12 max-w-3xl mx-auto">
      <h1 className="text-4xl font-headline font-bold text-[#e5e2e1] tracking-tight mb-3">New Project</h1>
      <p className="text-stone-400 text-sm mb-10">Choose the type of project you want to create.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          href="/projects/new?tier=normal"
          className="group bg-[#1c1b1b] ghost-border p-8 hover:bg-[#2a2a2a] transition-colors flex flex-col gap-4"
        >
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-2xl text-[#ffb595]">build</span>
            <h2 className="text-xl font-headline font-bold text-[#e5e2e1]">Normal Project</h2>
          </div>
          <p className="text-stone-400 text-sm leading-relaxed">
            For projects up to <span className="text-[#ffb595] font-bold">$200</span>. Create your project, add a repo, write devlogs, and submit for review — the standard Forge flow.
          </p>
          <div className="mt-auto pt-4">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-stone-500 group-hover:text-[#ffb595] transition-colors flex items-center gap-1">
              Get started
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </span>
          </div>
        </Link>

        <Link
          href="/projects/new?tier=advanced"
          className="group bg-[#1c1b1b] ghost-border p-8 hover:bg-[#2a2a2a] transition-colors flex flex-col gap-4 border border-[#ee671c]/20"
        >
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-2xl text-[#ee671c]">rocket_launch</span>
            <h2 className="text-xl font-headline font-bold text-[#e5e2e1]">Advanced Project</h2>
          </div>
          <p className="text-stone-400 text-sm leading-relaxed">
            For projects that cost more than $200. Your grant covers the full cost of the project. Requires a Slack pitch.
          </p>
          <div className="mt-auto pt-4">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-stone-500 group-hover:text-[#ee671c] transition-colors flex items-center gap-1">
              Learn more
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </span>
          </div>
        </Link>
      </div>
    </div>
  )
}
