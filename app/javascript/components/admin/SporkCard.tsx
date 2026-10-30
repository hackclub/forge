import { router } from '@inertiajs/react'
import { ExternalLink, RefreshCw } from 'lucide-react'
import { Badge } from '@/components/admin/ui/badge'
import { Button } from '@/components/admin/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/admin/ui/card'

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

export interface SporkCheckDetail {
  verdict: SporkVerdict
  hit?: boolean
  repo: string | null
  match_count: number
  results: SporkResult[]
  screen_errors: SporkScreenError[]
  error_message?: string | null
  checked_at?: string | null
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
  enabled,
  check,
}: {
  projectId: number
  enabled: boolean
  check: SporkCheckDetail | null
}) {
  function screen() {
    router.post(`/admin/spork/screen/${projectId}`, {}, { preserveScroll: true })
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Spork</CardTitle>
        <Button variant="ghost" size="sm" onClick={screen} disabled={!enabled}>
          <RefreshCw className="size-4" />
          {check ? 'Re-screen' : 'Screen'}
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <SporkVerdictBadge verdict={check?.verdict} />
          {check && check.match_count > 0 && (
            <span className="text-xs text-muted-foreground">
              {check.match_count} matching repo{check.match_count === 1 ? '' : 's'}
            </span>
          )}
        </div>
        {check ? (
          <>
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
