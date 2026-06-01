const TEMPLATE = `This is the first {ship_type} ship of {ship_name} for Forge. Submitted {submittion_time}

Time was logged journaling and committing through GitHub, This design may also include time lapsing if given by the user

This project was approved at {project_approval_time}

1. Journaling time was verified/deflated by {reviewer_name}{reviewer_email} to ensure it matches our policy of what is allowed. Inactive and unrelated time was stripped according to our policy publicly available at here: https://forge.hackclub.com/docs/design/how-to-journal The project was then checked to ensure it meets our requirements of a "shipped" hardware project, which is publicly available here: https://forge.hackclub.com/docs/design/journal-format & https://forge.hackclub.com/docs/requirements/submitting

3. A final check was done by Aarav (aarav@hackclub.com) and Souptik (Lead reviewer for forge), who is knowledgeable in hardware, to ensure nothing was missed prior, and that the projects meets our standards in terms of quality.

{hours_deflation} hours of deflation was applied to meet our requirements

The final reviewer was asked to justify why this ship meets the standards of the Unified DB:

{review_justification}

!! To inspect the full review for this ship, including timelapses & journals, see: {forge_admin_link}

For any questions, please reach out to aarav@hackclub.com.
`

export interface JustificationContext {
  ship_type: string
  ship_name: string
  submittion_time: string
  project_approval_time: string
  reviewer_name: string
  reviewer_email: string | null
  claimed_hours: number
  approved_hours: number
  review_justification: string
  forge_admin_link: string
}

export function buildJustification(ctx: JustificationContext): string {
  const deflation = Math.max(0, (ctx.claimed_hours - ctx.approved_hours)).toFixed(1)
  const reasoning = ctx.review_justification.trim() || '(no justification provided)'
  const emailPart = ctx.reviewer_email ? ` (${ctx.reviewer_email})` : ''
  return TEMPLATE.replace('{ship_type}', ctx.ship_type)
    .replace('{ship_name}', ctx.ship_name)
    .replace('{submittion_time}', ctx.submittion_time)
    .replace('{project_approval_time}', ctx.project_approval_time)
    .replace('{reviewer_name}', ctx.reviewer_name)
    .replace('{reviewer_email}', emailPart)
    .replace('{hours_deflation}', deflation.replace(/\.0$/, ''))
    .replace('{review_justification}', reasoning)
    .replace('{forge_admin_link}', ctx.forge_admin_link)
}

export function formatJustificationDate(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC',
      timeZoneName: 'short',
    })
  } catch {
    return iso
  }
}
