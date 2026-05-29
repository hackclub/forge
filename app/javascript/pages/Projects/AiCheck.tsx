import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, router } from '@inertiajs/react'

interface AiCheckRequirement {
  name: string
  verdict: 'pass' | 'fail' | 'uncertain'
  reasoning: string
  source: string
}

interface AiCheckResult {
  summary: string
  overall: 'pass' | 'fail' | 'uncertain'
  requirements: AiCheckRequirement[]
  checked_at: string
  model: string
  provider?: string
}

interface AiCheckProject {
  id: number
  name: string
  subtitle: string | null
  cover_image_url: string | null
}

const VERDICT_CONFIG: Record<
  AiCheckRequirement['verdict'],
  { label: string; icon: string; bg: string; text: string; border: string }
> = {
  pass: {
    label: 'Pass',
    icon: 'check_circle',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/20',
  },
  fail: {
    label: 'Fail',
    icon: 'cancel',
    bg: 'bg-red-500/10',
    text: 'text-red-400',
    border: 'border-red-500/20',
  },
  uncertain: {
    label: 'Check',
    icon: 'help',
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/20',
  },
}

function VerdictPill({ verdict }: { verdict: AiCheckRequirement['verdict'] }) {
  const cfg = VERDICT_CONFIG[verdict]
  return (
    <span
      className={`${cfg.bg} ${cfg.text} px-2 py-1 text-[10px] uppercase font-bold tracking-widest flex items-center gap-1.5 shrink-0`}
    >
      <span className="material-symbols-outlined text-sm">{cfg.icon}</span>
      {cfg.label}
    </span>
  )
}

function ProjectsAiCheck({
  project,
  result: initialResult,
  ran_at: initialRanAt,
}: {
  project: AiCheckProject
  result: AiCheckResult | null
  ran_at: string | null
}) {
  const [result, setResult] = useState<AiCheckResult | null>(initialResult)
  const [ranAt, setRanAt] = useState<string | null>(initialRanAt)
  const [running, setRunning] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const startedRef = useRef(false)

  const runCheck = useCallback(async () => {
    setRunning(true)
    setError(null)
    setResult(null)
    setRanAt(null)
    try {
      const csrf = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? ''
      const res = await fetch(`/projects/${project.id}/run_ai_check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf, Accept: 'application/json' },
        credentials: 'same-origin',
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || 'AI check failed. Try again in a moment.')
      } else {
        setResult(data.result)
        setRanAt(data.ran_at)
      }
    } catch {
      setError('Network error. Try again in a moment.')
    } finally {
      setRunning(false)
    }
  }, [project.id])

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true
    if (!initialResult) runCheck()
  }, [initialResult, runCheck])

  const counts = useMemo(() => {
    const reqs = result?.requirements ?? []
    return {
      pass: reqs.filter((r) => r.verdict === 'pass').length,
      fail: reqs.filter((r) => r.verdict === 'fail').length,
      uncertain: reqs.filter((r) => r.verdict === 'uncertain').length,
      total: reqs.length,
    }
  }, [result])

  const hasFails = counts.fail > 0
  const hasUncertain = counts.uncertain > 0

  function submitForReview() {
    setSubmitting(true)
    router.post(
      `/projects/${project.id}/submit_for_review`,
      {},
      {
        onFinish: () => setSubmitting(false),
      },
    )
  }

  const formattedRanAt = ranAt ? new Date(ranAt).toLocaleString() : null

  return (
    <div
      className="min-h-screen w-full bg-[#0e0e0e] text-[#e5e2e1] relative"
      style={{
        backgroundImage: "url('/ai_check_bg.png')",
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'bottom center',
        backgroundSize: '100% auto',
        backgroundAttachment: 'fixed',
      }}
    >
      <div className="p-5 md:p-12 max-w-3xl mx-auto relative">
        <Link
          href={`/projects/${project.id}`}
          className="text-stone-500 hover:text-stone-300 transition-colors text-xs font-bold uppercase tracking-[0.2em] flex items-center gap-1 mb-8"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Back to project
        </Link>

        <div className="flex items-center gap-3 mb-3">
          <span
            className="material-symbols-outlined text-4xl text-[#ca5924]"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            auto_awesome
          </span>
          <h1 className="text-4xl font-headline font-bold text-[#e5e2e1] tracking-tight">AI Pre-Submission Check</h1>
        </div>
        <p className="text-stone-400 text-sm leading-relaxed mb-8 max-w-2xl">
          Before a human reviewer takes a look, Orph will run your project through the Forge requirements. Most rejections
          could've been fixed in 5 minutes — let's catch the easy stuff first.
        </p>

        <div className="bg-[#1c1b1b] ghost-border p-6 mb-5">
          <div className="flex items-center gap-3">
            {project.cover_image_url && (
              <img src={project.cover_image_url} alt="" className="w-12 h-12 object-cover shrink-0 border border-white/10" />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-stone-500 mb-1">Checking</p>
              <p className="font-headline font-bold text-[#e5e2e1] text-lg truncate">{project.name}</p>
              {project.subtitle && (
                <p className="text-stone-500 text-xs truncate mt-0.5">{project.subtitle}</p>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 px-5 py-3 mb-5 text-red-300 text-sm flex items-start gap-2">
            <span className="material-symbols-outlined text-base shrink-0 mt-0.5">error</span>
            <div className="flex-1">
              <p className="font-bold mb-1">AI check failed</p>
              <p className="text-xs text-red-300/80">{error}</p>
            </div>
            <button
              onClick={runCheck}
              disabled={running}
              className="text-xs font-bold uppercase tracking-[0.15em] text-red-300 hover:text-red-100 cursor-pointer shrink-0"
            >
              Retry
            </button>
          </div>
        )}

        {running && !result && (
          <div className="bg-[#1c1b1b] ghost-border p-10 text-center mb-5">
            <span className="material-symbols-outlined text-4xl text-[#ca5924] animate-spin block mb-3">
              progress_activity
            </span>
            <p className="text-[#e5e2e1] font-headline font-bold text-lg mb-1">Scanning your project…</p>
            <p className="text-stone-500 text-xs">This can take up to a minute.</p>
          </div>
        )}

        {result && (
          <>
            <div className="bg-[#1c1b1b] ghost-border p-6 mb-5">
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-stone-500">Overall</span>
                <VerdictPill verdict={result.overall} />
                {formattedRanAt && (
                  <span className="text-[10px] uppercase tracking-[0.15em] text-stone-600 ml-auto">
                    Checked {formattedRanAt}
                  </span>
                )}
              </div>
              {result.summary && (
                <p className="text-stone-300 text-sm leading-relaxed whitespace-pre-wrap">{result.summary}</p>
              )}
              {counts.total > 0 && (
                <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-white/5 text-center">
                  <div>
                    <p className="text-2xl font-headline font-bold text-emerald-400">{counts.pass}</p>
                    <p className="text-[10px] uppercase tracking-[0.15em] text-stone-600 mt-1">Pass</p>
                  </div>
                  <div>
                    <p className="text-2xl font-headline font-bold text-amber-400">{counts.uncertain}</p>
                    <p className="text-[10px] uppercase tracking-[0.15em] text-stone-600 mt-1">Check</p>
                  </div>
                  <div>
                    <p className="text-2xl font-headline font-bold text-red-400">{counts.fail}</p>
                    <p className="text-[10px] uppercase tracking-[0.15em] text-stone-600 mt-1">Fail</p>
                  </div>
                </div>
              )}
            </div>

            {result.requirements.length > 0 && (
              <div className="space-y-2 mb-5">
                {result.requirements.map((req, idx) => {
                  const cfg = VERDICT_CONFIG[req.verdict]
                  return (
                    <div key={idx} className={`bg-[#1c1b1b] border ${cfg.border} p-4`}>
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <VerdictPill verdict={req.verdict} />
                        <span className="font-headline font-bold text-[#e5e2e1] text-sm">{req.name}</span>
                        {req.source && (
                          <span className="text-[10px] uppercase tracking-[0.15em] text-stone-600 font-mono ml-auto">
                            {req.source}
                          </span>
                        )}
                      </div>
                      {req.reasoning && <p className="text-stone-400 text-xs leading-relaxed">{req.reasoning}</p>}
                    </div>
                  )
                })}
              </div>
            )}

            <div className="bg-[#1c1b1b] ghost-border p-6 mb-5">
              <p className="text-[10px] uppercase tracking-[0.2em] text-stone-600 mb-3">
                Heads up — this is an AI double-check, not the final review. A human reviewer will still take a look.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href={`/projects/${project.id}`}
                  className="flex-1 ghost-border bg-[#0e0e0e] hover:bg-[#2a2a2a] text-stone-300 hover:text-[#e5e2e1] py-3 px-4 text-xs font-bold uppercase tracking-[0.15em] flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">arrow_back</span>
                  Go Back &amp; Fix
                </Link>
                <button
                  onClick={runCheck}
                  disabled={running}
                  className="ghost-border bg-[#0e0e0e] hover:bg-[#2a2a2a] text-stone-300 hover:text-[#ffb595] py-3 px-4 text-xs font-bold uppercase tracking-[0.15em] flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <span className={`material-symbols-outlined text-base ${running ? 'animate-spin' : ''}`}>
                    {running ? 'progress_activity' : 'refresh'}
                  </span>
                  {running ? 'Re-checking' : 'Re-run check'}
                </button>
                <button
                  onClick={submitForReview}
                  disabled={submitting || running}
                  className={`flex-1 py-3 px-4 text-xs font-bold uppercase tracking-[0.15em] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 ${
                    hasFails
                      ? 'bg-red-900/30 border border-red-500/30 text-red-300 hover:bg-red-900/50'
                      : 'signature-smolder text-[#4c1a00]'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">
                    {submitting ? 'progress_activity' : 'send'}
                  </span>
                  {submitting
                    ? 'Submitting…'
                    : hasFails
                      ? `Submit anyway (${counts.fail} fail${counts.fail === 1 ? '' : 's'})`
                      : hasUncertain
                        ? `Submit (${counts.uncertain} to double-check)`
                        : 'Submit for Review'}
                </button>
              </div>
              {hasFails && (
                <p className="text-red-400/80 text-[10px] uppercase tracking-[0.15em] mt-3 text-center">
                  Submissions with failing checks are likely to be returned to the back of the queue.
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

ProjectsAiCheck.layout = (page: ReactNode) => page

export default ProjectsAiCheck
