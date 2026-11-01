import { useState } from 'react'
import { router } from '@inertiajs/react'
import { Eye, EyeOff, ExternalLink, Flag, Loader2, RefreshCw, ShieldCheck, Undo2 } from 'lucide-react'
import { Badge } from '@/components/admin/ui/badge'
import { Button } from '@/components/admin/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/admin/ui/card'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/admin/ui/alert-dialog'
import { Textarea } from '@/components/admin/ui/textarea'
import { FlagDialog } from '@/components/admin/review/FlagDialog'

export type SporkVerdict = 'exclusive_match' | 'shared_template' | 'clear' | 'no_design_files' | 'failed'

export interface SporkMatch {
  repo: string
  url: string
  containment: number
  evidence?: { label: string; strength: string }[]
}

export interface SporkResult {
  mode: 'pcb' | 'cad'
  verdict: SporkVerdict
  verdict_label: string | null
  verdict_meaning: string | null
  match_count: number
  corpus_size: number | null
  files: number | null
  caveat: string | null
  matches: SporkMatch[]
}

export interface SporkScreenError {
  mode: 'pcb' | 'cad' | null
  statusCode: number
  message: string
}

export interface SporkInnocent {
  by: string | null
  at: string
  note: string | null
}

export interface SporkChecking {
  by: string | null
  at: string
  mine: boolean
}

export interface SporkCheckDetail {
  verdict: SporkVerdict
  hit?: boolean
  repo: string | null
  match_count: number
  results: SporkResult[]
  screen_errors: SporkScreenError[]
  error_message?: string | null
  checked_at?: string | null
  innocent?: SporkInnocent | null
  checking?: SporkChecking | null
}

export const sporkVerdictConfig: Record<
  SporkVerdict,
  { label: string; variant: 'success' | 'warning' | 'danger' | 'secondary' | 'outline' }
> = {
  exclusive_match: { label: 'Likely copied', variant: 'danger' },
  shared_template: { label: 'Shared template', variant: 'warning' },
  clear: { label: 'Clear', variant: 'success' },
  no_design_files: { label: 'No design files', variant: 'secondary' },
  failed: { label: 'Failed', variant: 'outline' },
}

export function isSafeUrl(url: string | null | undefined): boolean {
  if (!url) return false
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

export function SporkVerdictBadge({ verdict }: { verdict: SporkVerdict | null | undefined }) {
  const config = verdict ? sporkVerdictConfig[verdict] : null
  if (!config) return <Badge variant="outline">Not screened</Badge>
  return <Badge variant={config.variant}>{config.label}</Badge>
}

export function SporkInnocentBadge({ innocent }: { innocent: SporkInnocent | null | undefined }) {
  if (!innocent) return null
  const title = [`Marked innocent by ${innocent.by ?? 'unknown'} on ${innocent.at}`, innocent.note]
    .filter(Boolean)
    .join('\n')
  return (
    <Badge variant="success" title={title}>
      <ShieldCheck className="size-3" />
      Innocent
    </Badge>
  )
}

export function SporkCheckingBadge({ checking }: { checking: SporkChecking | null | undefined }) {
  if (!checking) return null
  return (
    <Badge variant="warning" title={`Checking since ${checking.at}`}>
      <Eye className="size-3" />
      Checking &middot; {checking.mine ? 'you' : (checking.by ?? 'unknown')}
    </Badge>
  )
}

export function SporkActions({
  projectId,
  projectName,
  innocent,
  checking,
  flagged,
  screened,
}: {
  projectId: number
  projectName: string
  innocent: boolean
  checking: SporkChecking | null
  flagged: boolean
  screened: boolean
}) {
  const [innocentOpen, setInnocentOpen] = useState(false)
  const [note, setNote] = useState('')
  const [flagOpen, setFlagOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function post(url: string, data: Record<string, string>, onSuccess?: () => void) {
    setSubmitting(true)
    router.post(url, data, {
      preserveScroll: true,
      onSuccess,
      onFinish: () => setSubmitting(false),
    })
  }

  function markInnocent() {
    post(`/admin/spork/innocent/${projectId}`, { note }, () => {
      setInnocentOpen(false)
      setNote('')
    })
  }

  function startChecking() {
    post(`/admin/spork/checking/${projectId}`, {})
  }

  function stopChecking() {
    post(`/admin/spork/stop_checking/${projectId}`, {})
  }

  function unmarkInnocent() {
    post(`/admin/spork/unmark_innocent/${projectId}`, {})
  }

  function flag() {
    post(`/admin/spork/flag/${projectId}`, { reason }, () => {
      setFlagOpen(false)
      setReason('')
    })
  }

  const resolved = innocent || flagged

  return (
    <>
      {!resolved && checking?.mine && (
        <Button variant="ghost" size="sm" onClick={stopChecking} disabled={submitting}>
          <EyeOff className="size-4" />
          Stop checking
        </Button>
      )}
      {!resolved && !checking?.mine && (
        <Button variant="ghost" size="sm" onClick={startChecking} disabled={!screened || submitting}>
          <Eye className="size-4" />
          {checking ? 'Take over' : 'Checking'}
        </Button>
      )}
      {innocent ? (
        <Button variant="ghost" size="sm" onClick={unmarkInnocent} disabled={submitting}>
          <Undo2 className="size-4" />
          Unmark
        </Button>
      ) : (
        <Button variant="ghost" size="sm" onClick={() => setInnocentOpen(true)} disabled={!screened || submitting}>
          <ShieldCheck className="size-4" />
          Innocent
        </Button>
      )}
      {!flagged && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setFlagOpen(true)}
          disabled={submitting}
          className="text-destructive hover:text-destructive"
        >
          <Flag className="size-4" />
          Flag
        </Button>
      )}

      <AlertDialog open={innocentOpen} onOpenChange={setInnocentOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark {projectName} innocent</AlertDialogTitle>
            <AlertDialogDescription>
              Removes this project from the Spork queue. It stays innocent across re-screens until someone unmarks it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional note (why is this a false positive?)"
            className="h-24 text-sm"
          />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
            <Button size="sm" onClick={markInnocent} disabled={submitting}>
              {submitting ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
              Mark innocent
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <FlagDialog
        open={flagOpen}
        onOpenChange={setFlagOpen}
        reason={reason}
        setReason={setReason}
        onSubmit={flag}
        submitting={submitting}
      />
    </>
  )
}

export function SporkMatchLink({ match }: { match: SporkMatch }) {
  const label = (
    <>
      <span className="font-mono truncate">{match.repo}</span>
      <span className="text-muted-foreground shrink-0">{Math.round(match.containment * 100)}%</span>
    </>
  )
  if (!isSafeUrl(match.url)) return <span className="inline-flex items-center gap-1.5 text-xs">{label}</span>
  return (
    <a
      href={match.url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-xs hover:underline min-w-0"
    >
      {label}
      <ExternalLink className="size-3 shrink-0" />
    </a>
  )
}

export function SporkCheckDetails({ check }: { check: SporkCheckDetail }) {
  return (
    <div className="space-y-3">
      {check.error_message && <p className="text-xs text-destructive">{check.error_message}</p>}
      {check.results.map((result) => (
        <div key={result.mode} className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium uppercase text-muted-foreground">{result.mode}</span>
            <SporkVerdictBadge verdict={result.verdict} />
            <span className="text-xs text-muted-foreground">
              {result.match_count} match{result.match_count === 1 ? '' : 'es'}
              {result.corpus_size != null && ` · ${result.corpus_size.toLocaleString()} repos compared`}
            </span>
          </div>
          {result.matches.length > 0 && (
            <ul className="space-y-1.5">
              {result.matches.map((match) => (
                <li key={match.repo} className="space-y-0.5">
                  <SporkMatchLink match={match} />
                  {match.evidence && match.evidence.length > 0 && (
                    <p className="text-[11px] text-muted-foreground">
                      {match.evidence.map((e) => `${e.label} (${e.strength})`).join(', ')}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
      {check.screen_errors.map((error, i) => (
        <p key={i} className="text-xs text-muted-foreground">
          {error.mode ? `${error.mode.toUpperCase()}: ` : ''}
          {error.message}
        </p>
      ))}
    </div>
  )
}

export default function SporkCard({
  projectId,
  projectName,
  enabled,
  flagged,
  check,
}: {
  projectId: number
  projectName: string
  enabled: boolean
  flagged: boolean
  check: SporkCheckDetail | null
}) {
  function screen() {
    router.post(`/admin/spork/screen/${projectId}`, {}, { preserveScroll: true })
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Spork</CardTitle>
        <div className="flex items-center gap-1">
          <SporkActions
            projectId={projectId}
            projectName={projectName}
            innocent={!!check?.innocent}
            checking={check?.checking ?? null}
            flagged={flagged}
            screened={!!check}
          />
          <Button variant="ghost" size="sm" onClick={screen} disabled={!enabled}>
            <RefreshCw className="size-4" />
            {check ? 'Re-screen' : 'Screen'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <SporkVerdictBadge verdict={check?.verdict} />
          <SporkInnocentBadge innocent={check?.innocent} />
          <SporkCheckingBadge checking={check?.checking} />
          {flagged && <Badge variant="danger">Flagged</Badge>}
          {check && check.match_count > 0 && (
            <span className="text-xs text-muted-foreground">
              {check.match_count} matching repo{check.match_count === 1 ? '' : 's'}
            </span>
          )}
        </div>
        {check ? (
          <>
            {check.innocent && (
              <p className="text-xs text-muted-foreground">
                Marked innocent by {check.innocent.by ?? 'unknown'} on {check.innocent.at}
                {check.innocent.note && <> &middot; {check.innocent.note}</>}
              </p>
            )}
            <SporkCheckDetails check={check} />
            {check.checked_at && <p className="text-[11px] text-muted-foreground">Checked {check.checked_at}</p>}
          </>
        ) : (
          <p className="text-xs text-muted-foreground">{enabled ? 'Not screened yet.' : 'Spork is not configured.'}</p>
        )}
      </CardContent>
    </Card>
  )
}
