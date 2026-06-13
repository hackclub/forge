import { Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/admin/ui/button'
import { verdictBadge } from './helpers'
import type { AiCheckResult } from './types'

export function AiCheckPanel({
  result,
  ranAt,
  running,
  onRun,
}: {
  result: AiCheckResult | null
  ranAt: string | null
  running: boolean
  onRun: () => void
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-card p-3">
        <div className="text-xs text-muted-foreground">
          {ranAt ? (
            <>
              Last run <span className="font-mono">{ranAt}</span>
              {result?.model && <span> · {result.model}</span>}
            </>
          ) : (
            'Not run yet for this project.'
          )}
        </div>
        <Button size="sm" onClick={onRun} disabled={running}>
          {running ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          {running ? 'Checking…' : ranAt ? 'Re-run' : 'Run check'}
        </Button>
      </div>

      {result?.status === 'error' ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {result.message || 'AI check failed. Try again in a moment.'}
        </div>
      ) : result?.status === 'queued' || result?.status === 'running' ? (
        <div className="flex items-center gap-2 rounded-md border border-border bg-card p-3 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          {result.status === 'running' ? 'Scanning the project…' : 'Queued — starting in a moment…'}
        </div>
      ) : result?.overall ? (
        <>
          <div className="rounded-md border border-border bg-card p-3 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">Overall</span>
              {verdictBadge(result.overall)}
            </div>
            {result.summary && <p className="text-sm whitespace-pre-wrap">{result.summary}</p>}
          </div>

          {(result.requirements ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground p-3">No specific requirements returned.</p>
          ) : (
            <div className="space-y-2">
              {(result.requirements ?? []).map((req, idx) => (
                <div key={idx} className="rounded-md border border-border bg-card p-3 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {verdictBadge(req.verdict)}
                    <span className="text-sm font-semibold">{req.name}</span>
                    {req.source && <span className="text-xs text-muted-foreground font-mono">{req.source}</span>}
                  </div>
                  {req.reasoning && <p className="text-xs text-muted-foreground">{req.reasoning}</p>}
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        !running && (
          <p className="text-sm text-muted-foreground p-3">
            Click <strong>Run check</strong> to have the AI evaluate this project against the Forge requirements +
            design docs.
          </p>
        )
      )}
    </div>
  )
}
