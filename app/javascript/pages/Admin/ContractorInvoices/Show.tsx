import { Link, router, usePage } from '@inertiajs/react'
import { ArrowLeft, Printer } from 'lucide-react'
import { Badge } from '@/components/admin/ui/badge'
import { Button } from '@/components/admin/ui/button'
import { Card, CardContent } from '@/components/admin/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/admin/ui/table'
import InvoiceStatusBadge from '@/components/admin/contractors/InvoiceStatusBadge'
import SignatureForm from '@/components/admin/contractors/SignatureForm'
import {
  formatCents,
  formatDate,
  formatWeek,
  type ContractorAgreement,
  type ContractorInvoice,
  type InvoiceLineItem,
} from '@/components/admin/contractors/lib'
import type { SharedProps } from '@/types'

const decisionLabels: Record<InvoiceLineItem['decision'], string> = {
  approved: 'Approved',
  returned: 'Returned',
  rejected: 'Rejected',
}

const flagLabels: Record<NonNullable<InvoiceLineItem['flag']>, string> = {
  reversed: 'Reversed',
  no_justification: 'No justification',
}

export default function AdminContractorInvoiceShow({
  invoice,
  contractor,
  agreement,
  can_sign,
  can_mark_paid,
}: {
  invoice: ContractorInvoice & { line_items: InvoiceLineItem[] }
  contractor: { id: number; display_name: string; email: string }
  agreement: ContractorAgreement
  can_sign: boolean
  can_mark_paid: boolean
}) {
  const { auth } = usePage<SharedProps>().props
  const backHref = auth.user?.id === contractor.id ? '/admin/my_contract' : `/admin/contractors/${contractor.id}`

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-3 print:hidden">
        <Button variant="ghost" size="sm" asChild>
          <Link href={backHref}>
            <ArrowLeft />
            Back
          </Link>
        </Button>
        <div className="flex gap-2">
          {can_mark_paid && (
            <Button variant="outline" onClick={() => router.post(`/admin/contractor_invoices/${invoice.id}/mark_paid`)}>
              Mark paid
            </Button>
          )}
          <Button variant="outline" onClick={() => window.print()}>
            <Printer />
            Print
          </Button>
        </div>
      </div>

      <Card className="print:border-none print:shadow-none">
        <CardContent className="p-6 space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Invoice #{invoice.id}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Reviews for {formatWeek(invoice.week_start, invoice.week_end)} (Eastern Time)
              </p>
            </div>
            <InvoiceStatusBadge status={invoice.status} />
          </div>

          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">From</p>
              <p className="font-medium">{agreement.signed_name}</p>
              <p className="text-muted-foreground">{contractor.email}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Bill to</p>
              <p className="font-medium">The Hack Foundation d.b.a. Hack Club</p>
              <p className="text-muted-foreground">15 Falls Road, Shelburne, VT 05482</p>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Decision</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.line_items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No reviews this week.
                  </TableCell>
                </TableRow>
              ) : (
                invoice.line_items.map((item) => (
                  <TableRow key={item.audit_event_id}>
                    <TableCell className="text-muted-foreground text-xs">{formatDate(item.reviewed_at)}</TableCell>
                    <TableCell className="font-medium">{item.project_name}</TableCell>
                    <TableCell className="text-muted-foreground">{item.build_review ? 'Build' : 'Design'}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-2">
                        {decisionLabels[item.decision]}
                        {item.flag && <Badge variant="danger">{flagLabels[item.flag]}</Badge>}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono">{formatCents(item.amount_cents)}</TableCell>
                  </TableRow>
                ))
              )}
              <TableRow>
                <TableCell colSpan={4} className="text-right font-medium">
                  Total ({invoice.review_count} paid review{invoice.review_count === 1 ? '' : 's'})
                </TableCell>
                <TableCell className="text-right font-mono font-semibold">{formatCents(invoice.total_cents)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>

          <p className="text-xs text-muted-foreground">
            Rates per contract: {formatCents(agreement.rates.approve)} per approval with written justification,{' '}
            {formatCents(agreement.rates.return)} per return, {formatCents(agreement.rates.reject)} per rejection.
            Payable at the End of Forge.
          </p>

          {invoice.signed_at && (
            <div className="border-t border-border pt-4 text-sm space-y-1">
              <p>
                Signed by <span className="font-medium">{invoice.signed_name}</span> on {formatDate(invoice.signed_at)}
              </p>
              {invoice.paid_at && <p className="text-muted-foreground">Paid on {formatDate(invoice.paid_at)}</p>}
            </div>
          )}

          {can_sign && (
            <div className="border-t border-border pt-4">
              <SignatureForm
                action={`/admin/contractor_invoices/${invoice.id}/sign`}
                submitLabel={`Sign invoice for ${formatCents(invoice.total_cents)}`}
                agreement="I confirm these reviews were carried out by me under my Reviewer contract and that this invoice is accurate."
                extra={{ total_cents: invoice.total_cents }}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
