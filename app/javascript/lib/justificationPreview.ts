const NOT_PROVIDED = '(not provided)'

export interface JustificationContext {
  kind: 'design' | 'build'
  name: string
  record_label: string
  submitted_at_iso: string
  reviewer_name: string
  reviewer_email: string | null
  claimed_hours: number
  approved_hours: number
  repo_link: string | null
  devlog_count: number
  public_url: string
  admin_url: string
  hackatime_project: string
  time_range: string
  time_summary: string
  scope_reasoning: string
  evidence: string
  assessment: string
  deflation_reason: string
}

function present(value: string | null | undefined): string {
  const v = (value ?? '').trim()
  return v || NOT_PROVIDED
}

function formatHours(value: number): string {
  const rounded = Math.round(value * 10) / 10
  const whole = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)
  return `${whole}h`
}

function timeEvidence(ctx: JustificationContext): string {
  if (ctx.kind === 'build') return present(ctx.time_summary)
  return [
    `Hackatime project: ${present(ctx.hackatime_project)}`,
    `Range analyzed: ${present(ctx.time_range)}`,
    present(ctx.time_summary),
  ].join('\n')
}

function supportingEvidence(ctx: JustificationContext): string {
  const lines = [
    `- Code repository: ${ctx.repo_link?.trim() || '(no repository linked)'}`,
    `- Public project page: ${ctx.public_url}`,
    `- Devlogs: ${ctx.devlog_count} ${ctx.devlog_count === 1 ? 'entry' : 'entries'}`,
  ]
  ;(ctx.evidence ?? '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .forEach((l) => lines.push(`- ${l}`))
  return lines.join('\n')
}

export function buildJustification(ctx: JustificationContext): string {
  const emailPart = ctx.reviewer_email ? ` (${ctx.reviewer_email})` : ''
  const deflationRaw = Math.max(0, Math.round((ctx.claimed_hours - ctx.approved_hours) * 10) / 10)
  const deflation = String(deflationRaw).replace(/\.0$/, '')
  const deflationReason = (ctx.deflation_reason ?? '').trim()
  const deflationSuffix = deflationRaw > 0 && deflationReason ? ` — reason: ${deflationReason}` : ''
  const reasoning = (ctx.assessment ?? '').trim() || '(no justification provided)'
  const submitted = formatJustificationDate(ctx.submitted_at_iso)
  const approved = formatJustificationDate(new Date().toISOString())

  return `This is the first ${ctx.kind} ship of ${ctx.name} for Forge. Submitted ${submitted}

Time was logged journaling and committing through GitHub, This design may also include time lapsing if given by the user

This project was approved at ${approved}

1. Journaling time was verified/deflated by ${ctx.reviewer_name}${emailPart} to ensure it matches our policy of what is allowed. Inactive and unrelated time was stripped according to our policy publicly available at here: https://forge.hackclub.com/docs/design/how-to-journal The project was then checked to ensure it meets our requirements of a "shipped" hardware project, which is publicly available here: https://forge.hackclub.com/docs/design/journal-format & https://forge.hackclub.com/docs/requirements/submitting

3. A final check was done by Aarav (aarav@hackclub.com) and Souptik (Lead reviewer for forge), who is knowledgeable in hardware, to ensure nothing was missed prior, and that the projects meets our standards in terms of quality.

Time evidence:
${timeEvidence(ctx)}

Scope assessment:
${present(ctx.scope_reasoning)}

Supporting evidence:
${supportingEvidence(ctx)}

Hours claimed: ${formatHours(ctx.claimed_hours)}. Hours approved: ${formatHours(ctx.approved_hours)}.
${deflation} hours of deflation was applied to meet our requirements${deflationSuffix}

The final reviewer was asked to justify why this ship meets the standards of the Unified DB:

${reasoning}

!! To inspect the full review for this ship, including timelapses & journals, see: ${ctx.admin_url}

For any questions, please reach out to aarav@hackclub.com.
`
}

export function formatJustificationDate(iso: string): string {
  try {
    const d = new Date(iso)
    const date = d.toLocaleString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC',
    })
    const time = d.toLocaleString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'UTC',
    })
    return `${date} at ${time} UTC`
  } catch {
    return iso
  }
}
