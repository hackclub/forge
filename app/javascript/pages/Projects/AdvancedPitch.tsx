import { Link } from '@inertiajs/react'

export default function ProjectsAdvancedPitch() {
  return (
    <div className="p-12 max-w-2xl mx-auto">
      <Link href="/projects/new" className="text-stone-500 hover:text-stone-300 transition-colors text-xs font-bold uppercase tracking-[0.2em] flex items-center gap-1 mb-8">
        <span className="material-symbols-outlined text-sm">arrow_back</span>
        Back
      </Link>

      <div className="flex items-center gap-3 mb-4">
        <span
          className="material-symbols-outlined text-4xl text-[#ee671c]"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          precision_manufacturing
        </span>
        <h1 className="text-4xl font-headline font-bold text-[#e5e2e1] tracking-tight">Advanced Project</h1>
      </div>

      <p className="text-stone-400 text-sm leading-relaxed mb-8">
        For projects that cost more than $200, your grant covers the full cost. To get started, post your pitch in{' '}
        <span className="text-[#ffb595] font-bold">#into-the-forge</span>{' '}
        on Slack with a detailed description and rough BOM. It'll be picked up automatically.
      </p>

      <div className="bg-[#1c1b1b] ghost-border p-8 mb-8">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-stone-500 font-headline mb-5">Pitch Format</h2>
        <div className="text-stone-500 text-sm leading-relaxed font-mono space-y-2">
          <p><span className="text-stone-300">Name:</span> Your project name</p>
          <p><span className="text-stone-300">I&apos;m designing:</span> what you&apos;re building</p>
          <p><span className="text-stone-300">Inspo / reference:</span> links &amp; references</p>
          <p><span className="text-stone-300">Past projects:</span> your experience</p>
          <p><span className="text-stone-300">Why this is worth more than $200:</span> justification</p>
          <p><span className="text-stone-300">Rough BOM:</span></p>
          <p className="pl-4">Item $XX</p>
          <p className="pl-4">Item $XX</p>
          <p><span className="text-stone-300">Total:</span> $XXX</p>
        </div>
      </div>

      <a
        href="https://hackclub.slack.com/channels/into-the-forge"
        target="_blank"
        rel="noopener noreferrer"
        className="signature-smolder text-[#4c1a00] font-headline font-bold py-3 px-4 flex items-center justify-center gap-2 active:scale-95 transition-transform w-full"
      >
        <span className="material-symbols-outlined text-lg">open_in_new</span>
        Open #into-the-forge
      </a>
    </div>
  )
}
