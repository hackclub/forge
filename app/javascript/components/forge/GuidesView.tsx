import { useEffect, useRef, useState } from 'react'
import { router, usePage } from '@inertiajs/react'
import { ForgeLoading } from './useForgeData'

interface GuideFile {
  name: string
  url: string
  language: string | null
  size: number
  content: string | null
}

interface GuideStep {
  title: string
  content_html: string
  files: GuideFile[]
}

interface GuideDetail {
  slug: string
  title: string
  description: string | null
  steps: GuideStep[]
}

interface GuideSummary {
  slug: string
  title: string
  description: string | null
  steps_count: number
}

interface GuidesData {
  list: GuideSummary[]
  guide: GuideDetail | null
}

function progressKey(slug: string) {
  return `forge-guide-progress:${slug}`
}

function loadProgress(slug: string): number[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(progressKey(slug)) || '[]')
    return Array.isArray(parsed) ? parsed.filter((n) => typeof n === 'number') : []
  } catch {
    return []
  }
}

function saveProgress(slug: string, completed: number[]) {
  try {
    localStorage.setItem(progressKey(slug), JSON.stringify(completed))
  } catch {
    /* storage unavailable */
  }
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function GuidesView({ onBack }: { onBack: () => void }) {
  const live = (usePage().props as Record<string, unknown>).guides as GuidesData | undefined
  const [cached, setCached] = useState<GuidesData | null>(live ?? null)
  const [activeSlug, setActiveSlug] = useState<string | null>(null)
  const requested = useRef(false)

  useEffect(() => {
    if (live === undefined && !requested.current) {
      requested.current = true
      router.reload({ only: ['guides'] })
    }
  }, [live])

  useEffect(() => {
    if (live !== undefined) setCached(live)
  }, [live])

  if (!cached) return <ForgeLoading />

  function openGuide(slug: string) {
    setActiveSlug(slug)
    if (cached?.guide?.slug !== slug) {
      router.reload({ only: ['guides'], data: { guide: slug } })
    }
  }

  if (activeSlug) {
    const guide = cached.guide?.slug === activeSlug ? cached.guide : null
    if (!guide) return <ForgeLoading />
    return <GuideViewer key={guide.slug} guide={guide} onBack={() => setActiveSlug(null)} />
  }

  return <GuideList guides={cached.list} onBack={onBack} onOpen={openGuide} />
}

function BackButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex cursor-pointer items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-stone-500 transition-colors hover:text-[#ffb595]"
    >
      <span className="material-symbols-outlined text-sm">arrow_back</span>
      {label}
    </button>
  )
}

function GuideList({
  guides,
  onBack,
  onOpen,
}: {
  guides: GuideSummary[]
  onBack: () => void
  onOpen: (slug: string) => void
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <BackButton label="Resources" onClick={onBack} />
        <p className="text-sm text-stone-400">Step-by-step walkthroughs to get you building.</p>
      </div>

      {guides.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {guides.map((guide) => {
            const done = loadProgress(guide.slug).filter((i) => i < guide.steps_count).length
            return (
              <button
                key={guide.slug}
                type="button"
                onClick={() => onOpen(guide.slug)}
                className="group flex cursor-pointer flex-col gap-2 bg-[#1c1b1b] p-5 text-left ghost-border corner-accents transition-colors hover:bg-[#2a2a2a]"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="material-symbols-outlined text-2xl text-[#ca5924]">route</span>
                  <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-stone-500">
                    {done > 0 ? `${done}/${guide.steps_count} steps` : `${guide.steps_count} steps`}
                  </span>
                </div>
                <h3 className="font-headline text-lg font-medium text-[#e5e2e1] transition-colors group-hover:text-[#ffb595]">
                  {guide.title}
                </h3>
                {guide.description && <p className="text-sm text-stone-500">{guide.description}</p>}
                {done > 0 && (
                  <div className="mt-1 h-1 w-full bg-[#0e0e0e]">
                    <div className="h-full bg-[#ca5924]" style={{ width: `${(done / guide.steps_count) * 100}%` }} />
                  </div>
                )}
              </button>
            )
          })}
        </div>
      ) : (
        <div className="bg-[#1c1b1b] p-16 text-center ghost-border">
          <span className="material-symbols-outlined mb-4 text-5xl text-stone-700">route</span>
          <p className="mb-2 font-headline text-lg font-medium text-stone-300">No guides yet</p>
          <p className="text-sm text-stone-500">Check back soon — guides are on the way.</p>
        </div>
      )}
    </div>
  )
}

function GuideViewer({ guide, onBack }: { guide: GuideDetail; onBack: () => void }) {
  const [completed, setCompleted] = useState<number[]>(() => loadProgress(guide.slug))
  const [stepIndex, setStepIndex] = useState(() => {
    const done = loadProgress(guide.slug)
    const next = guide.steps.findIndex((_, i) => !done.includes(i))
    return next === -1 ? 0 : next
  })
  const rootRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    rootRef.current?.closest('.overflow-y-auto')?.scrollTo({ top: 0 })
  }, [stepIndex])

  const step = guide.steps[stepIndex]
  const isLast = stepIndex === guide.steps.length - 1

  function markComplete(index: number) {
    setCompleted((prev) => {
      if (prev.includes(index)) return prev
      const next = [...prev, index]
      saveProgress(guide.slug, next)
      return next
    })
  }

  function advance() {
    markComplete(stepIndex)
    if (isLast) onBack()
    else setStepIndex(stepIndex + 1)
  }

  const doneCount = completed.filter((i) => i < guide.steps.length).length

  return (
    <div ref={rootRef} className="space-y-5">
      <div className="space-y-2">
        <BackButton label="All guides" onClick={onBack} />
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="font-headline text-xl font-bold text-[#e5e2e1]">{guide.title}</h3>
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-stone-500">
            Step {stepIndex + 1} of {guide.steps.length}
          </span>
        </div>
        <div className="h-1 w-full bg-[#0e0e0e]">
          <div
            className="h-full bg-[#ca5924] transition-all duration-300"
            style={{ width: `${(doneCount / guide.steps.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 lg:hidden">
        {guide.steps.map((s, i) => (
          <StepTab key={i} step={s} index={i} current={i === stepIndex} done={completed.includes(i)} compact onSelect={() => setStepIndex(i)} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="hidden lg:block lg:max-h-[60vh] lg:overflow-y-auto lg:pr-1">
          <ul className="space-y-1">
            {guide.steps.map((s, i) => (
              <li key={i}>
                <StepTab step={s} index={i} current={i === stepIndex} done={completed.includes(i)} onSelect={() => setStepIndex(i)} />
              </li>
            ))}
          </ul>
        </aside>

        <div className="min-w-0 space-y-6">
          <h4 className="font-headline text-2xl font-bold text-[#e5e2e1]">{step.title}</h4>
          <div className="markdown-content" dangerouslySetInnerHTML={{ __html: step.content_html }} />

          {step.files.length > 0 && (
            <div className="space-y-3">
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">Files</div>
              {step.files.map((file) => (
                <FileCard key={file.url} file={file} />
              ))}
            </div>
          )}

          <div className="flex items-center justify-between gap-3 border-t border-white/5 pt-4">
            <button
              type="button"
              onClick={() => setStepIndex(stepIndex - 1)}
              disabled={stepIndex === 0}
              className="inline-flex cursor-pointer items-center gap-1.5 bg-[#2a2a2a] px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] text-stone-400 ghost-border transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
            >
              <span className="material-symbols-outlined text-sm">chevron_left</span>
              Back
            </button>
            <button
              type="button"
              onClick={advance}
              className="inline-flex cursor-pointer items-center gap-1.5 signature-smolder px-5 py-2 text-xs font-bold uppercase tracking-[0.15em] text-[#4c1a00]"
            >
              {isLast ? 'Finish guide' : 'Next step'}
              <span className="material-symbols-outlined text-sm">{isLast ? 'check' : 'chevron_right'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function StepTab({
  step,
  index,
  current,
  done,
  compact = false,
  onSelect,
}: {
  step: GuideStep
  index: number
  current: boolean
  done: boolean
  compact?: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex cursor-pointer items-center gap-2 px-3 py-1.5 text-left text-sm transition-colors ${
        compact ? 'shrink-0 whitespace-nowrap' : 'w-full'
      } ${
        current
          ? 'bg-[#2a2a2a] text-[#ffb595] ghost-border'
          : done
            ? 'text-stone-300 hover:text-[#ffb595]'
            : 'text-stone-500 hover:text-stone-300'
      }`}
    >
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center text-[10px] font-bold ${
          done ? 'bg-emerald-900/40 text-emerald-300' : 'bg-[#0e0e0e] text-stone-500 ghost-border'
        }`}
      >
        {done ? <span className="material-symbols-outlined text-xs leading-none">check</span> : index + 1}
      </span>
      <span className={compact ? '' : 'truncate'}>{step.title}</span>
    </button>
  )
}

function FileCard({ file }: { file: GuideFile }) {
  const [copied, setCopied] = useState(false)
  const [expanded, setExpanded] = useState(true)

  function copy() {
    if (!file.content) return
    navigator.clipboard?.writeText(file.content).then(() => {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <div className="bg-[#0e0e0e] ghost-border">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="material-symbols-outlined text-base text-[#ca5924]">description</span>
          <span className="truncate font-mono text-xs text-stone-300">{file.name}</span>
          <span className="text-[10px] uppercase tracking-widest text-stone-600">{formatSize(file.size)}</span>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {file.content && (
            <>
              <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="cursor-pointer px-2 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-stone-500 transition-colors hover:text-[#ffb595]"
              >
                {expanded ? 'Hide' : 'View'}
              </button>
              <button
                type="button"
                onClick={copy}
                className="cursor-pointer px-2 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-stone-500 transition-colors hover:text-[#ffb595]"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </>
          )}
          <a
            href={file.url}
            download={file.name}
            className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-stone-500 transition-colors hover:text-[#ffb595]"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            Download
          </a>
        </div>
      </div>
      {file.content && expanded && (
        <pre className="max-h-72 overflow-auto p-3 font-mono text-xs leading-relaxed text-stone-300">{file.content}</pre>
      )}
    </div>
  )
}
