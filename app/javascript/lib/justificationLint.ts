/**
 * Client-side mirror of app/lib/justification_lint.rb.
 *
 * The phrase patterns and thresholds are not duplicated here — they arrive as
 * `justification_rules` from the server, so Ruby stays the single source of
 * truth and the two cannot drift. This exists purely so a reviewer sees the
 * problem while typing instead of after clicking Approve; the server re-runs
 * the same rules on submit and is the actual gate.
 */

export interface JustificationRules {
  empty_assertions: { source: string; flags: string; fine: string }[]
  builder_addressed: { source: string; flags: string }[]
  placeholders: { source: string; flags: string }[]
  evidence_markers: { source: string; flags: string }
  min_assessment_chars: number
  min_technical_chars: number
}

export type LintField = 'assessment' | 'technical_features' | 'evidence' | 'override'
export type LintSeverity = 'block' | 'warn'

export interface LintIssue {
  field: LintField
  code: string
  severity: LintSeverity
  message: string
  fine?: string
}

export interface LintInput {
  timeSummary: string
  technicalFeatures: string
  evidence: string
  assessment: string
  additional: string
  deflationReason: string
  claimedHours: number
  approvedHours: number
  journalOnly: boolean
  usesAi: boolean
  hasLapse: boolean
  redFlags: string[]
}

function re(rule: { source: string; flags: string }): RegExp | null {
  try {
    return new RegExp(rule.source, rule.flags)
  } catch {
    return null
  }
}

function slug(text: string): string {
  return text.toLowerCase().trim().replace(/\s+/g, '_')
}

export function lintJustification(input: LintInput, rules: JustificationRules | null): LintIssue[] {
  if (!rules) return []

  const issues: LintIssue[] = []
  const assessment = input.assessment ?? ''
  const technical = input.technicalFeatures ?? ''
  const deflation = Math.max(0, Math.round((input.claimedHours - input.approvedHours) * 10) / 10)

  const emptyAssertions = (field: LintField, text: string) => {
    if (!text.trim()) return
    for (const rule of rules.empty_assertions) {
      const pattern = re(rule)
      const match = pattern && text.match(pattern)
      if (!match) continue
      issues.push({
        field,
        code: `empty_assertion:${slug(match[0])}`,
        severity: 'block',
        message: `“${match[0].trim()}” asserts a conclusion without evidence — say what you checked and what it showed.`,
        fine: rule.fine,
      })
    }
  }

  emptyAssertions('assessment', assessment)
  emptyAssertions('technical_features', technical)

  if (assessment.trim() && rules.builder_addressed.some((r) => re(r)?.test(assessment))) {
    issues.push({
      field: 'assessment',
      code: 'builder_addressed',
      severity: 'block',
      message:
        'This reads as a message to the builder. The justification is an internal record for whoever audits the Unified DB — put encouragement in the feedback field instead.',
      fine: 'The handbook lists "Good job :)" and "Great project, approved!" as non-compliant: the record is not feedback to the submitter.',
    })
  }

  if (!assessment.trim()) {
    issues.push({ field: 'assessment', code: 'missing', severity: 'block', message: 'No justification written.' })
  } else {
    if (rules.placeholders.some((r) => re(r)?.test(assessment))) {
      issues.push({
        field: 'assessment',
        code: 'placeholder',
        severity: 'block',
        message: 'A placeholder is not a justification.',
      })
    }
    if (/^[\d.\s hrshours]+$/i.test(assessment.trim())) {
      issues.push({
        field: 'assessment',
        code: 'hours_only',
        severity: 'block',
        message: 'This is just a number. Explain why the work is worth that number.',
        fine: 'the justification is just the number of hours',
      })
    }
    if (assessment.trim().length < rules.min_assessment_chars) {
      issues.push({
        field: 'assessment',
        code: 'too_short',
        severity: 'block',
        message: `Too short to be checkable (${assessment.trim().length} of ${rules.min_assessment_chars} characters). A stranger has to reach your conclusion from what you wrote.`,
      })
    }
    const markers = re(rules.evidence_markers)
    if (markers && !markers.test(assessment)) {
      issues.push({
        field: 'assessment',
        code: 'no_evidence_cited',
        severity: 'block',
        message:
          'Cite the actual evidence — journal entries, commits, or timelapse links. Right now nothing here can be independently checked.',
      })
    }
    if (!/\d/.test(assessment)) {
      issues.push({
        field: 'assessment',
        code: 'no_numbers',
        severity: 'block',
        message:
          'No numbers anywhere. Reference the hours, the entry count, or the date range so the figure is traceable.',
      })
    }
    if (input.claimedHours >= 40 && assessment.trim().length < 300) {
      issues.push({
        field: 'assessment',
        code: 'high_hours_thin',
        severity: 'warn',
        message: `${input.claimedHours.toFixed(1)}h is a large claim — high-hour projects get read closely, so spell out the scope that supports it.`,
      })
    }
  }

  if (!technical.trim()) {
    issues.push({
      field: 'technical_features',
      code: 'missing',
      severity: 'block',
      message: 'List the specific technical features that account for the hours.',
    })
  } else if (technical.trim().length < rules.min_technical_chars) {
    issues.push({
      field: 'technical_features',
      code: 'too_short',
      severity: 'block',
      message: `Name concrete implementation work, not a summary (${technical.trim().length} of ${rules.min_technical_chars} characters).`,
      fine: "CAD paint brush holder is not a technical feature, it's the title of the project",
    })
  }

  if (!input.evidence.trim() && !input.timeSummary.trim()) {
    issues.push({
      field: 'evidence',
      code: 'no_links',
      severity: 'warn',
      message:
        'No supporting links. Paste the journal entries you relied on — reviewers get fined for justifications a stranger cannot follow.',
    })
  }

  if (deflation > 0 && input.deflationReason.trim().length < 15) {
    issues.push({
      field: 'override',
      code: 'deflation_unexplained',
      severity: 'block',
      message: `${deflation}h deflated with no real reason recorded. State what evidence drove the number.`,
    })
  }
  if (input.journalOnly && deflation === 0) {
    issues.push({
      field: 'override',
      code: 'journal_only_no_deflation',
      severity: 'warn',
      message:
        'Only journals being used to track it. Please make sure you are deflating accuratley as not deflating enough can get us fined!',
    })
  }

  if (input.usesAi) {
    const combined = `${assessment} ${input.additional}`
    if (!/\bai\b|\bllm\b|claude|chatgpt|copilot|cursor|generated/i.test(combined)) {
      issues.push({
        field: 'assessment',
        code: 'ai_undisclosed',
        severity: 'block',
        message:
          'The builder declared AI use but the justification never addresses it. Say how much is AI-authored and how you handled it.',
      })
    }
    if (deflation === 0) {
      issues.push({
        field: 'override',
        code: 'ai_no_deflation',
        severity: 'warn',
        message:
          'AI-assisted project approved at full hours. Programs are fined routinely for this — deflate or justify the exception explicitly.',
      })
    }
  }

  // The handbook requires lapse time to be addressed explicitly, and requires
  // extra justification whenever the submission has suspicious characteristics.
  if (input.hasLapse) {
    const combined = `${assessment} ${input.additional}`
    if (!/lapse|timelapse|on.?task/i.test(combined)) {
      issues.push({
        field: 'assessment',
        code: 'lapse_unaddressed',
        severity: 'block',
        message:
          'This project has timelapse evidence, which the handbook requires you to address: say how much of the lapse was on-task and what deflation you applied.',
        fine: 'some time in lapse (writing devlogs/transferring devlogs from beest) needs to be deflated, but no deflation was applied',
      })
    }
    if (
      deflation === 0 &&
      /lapse/i.test(combined) &&
      !/no deflation|none needed|fully on.?task|entirely on.?task/i.test(combined)
    ) {
      issues.push({
        field: 'override',
        code: 'lapse_no_deflation',
        severity: 'warn',
        message:
          'Lapse time approved in full. If all of it was on-task, say so explicitly — the handbook treats silence here as non-compliant.',
      })
    }
  }

  const flags = input.redFlags.filter(Boolean)
  if (flags.length > 0 && input.additional.trim().length < 40) {
    issues.push({
      field: 'assessment',
      code: 'red_flags_unaddressed',
      severity: 'block',
      message: `Forge flagged ${flags.length} thing${flags.length === 1 ? '' : 's'} on this project (${flags.slice(0, 3).join('; ')}). The handbook requires extra justification when a submission has suspicious characteristics — address it in the extra-context field.`,
      fine: 'Additional Justification — required when the submission has suspicious characteristics',
    })
  }

  const seen = new Set<string>()
  return issues.filter((i) => {
    const key = `${i.field}/${i.code}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function hasBlockingIssues(issues: LintIssue[]): boolean {
  return issues.some((i) => i.severity === 'block')
}
