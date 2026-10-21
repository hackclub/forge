export interface ContractorRates {
  approve: number
  return: number
  reject: number
}

export interface ContractorAgreement {
  id: number
  contract_version: string
  signed_name: string
  signed_email: string | null
  signed_at: string
  billable_from: string
  rates: ContractorRates
}

export type InvoiceStatus = 'pending_signature' | 'signed' | 'paid'

export interface InvoiceLineItem {
  audit_event_id: number
  project_id: number
  project_name: string
  build_review: boolean
  decision: 'approved' | 'returned' | 'rejected'
  reviewed_at: string
  flag: 'reversed' | 'no_justification' | null
  amount_cents: number
}

export interface ContractorInvoice {
  id: number
  week_start: string
  week_end: string
  status: InvoiceStatus
  review_count: number
  total_cents: number
  signed_name: string | null
  signed_at: string | null
  paid_at: string | null
  line_items?: InvoiceLineItem[]
}

export interface CurrentWeek {
  week_start: string
  week_end: string
  review_count: number
  total_cents: number
  line_items?: InvoiceLineItem[]
}

export interface InvoiceTotals {
  awaiting_signature_cents: number
  owed_cents: number
  paid_cents: number
}

export function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

export function formatDate(isoDate: string): string {
  const [y, m, d] = isoDate.slice(0, 10).split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export function formatWeek(start: string, end: string): string {
  return `${formatDate(start)} – ${formatDate(end)}`
}
