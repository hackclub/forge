import { Link } from '@inertiajs/react'
import { FileSignature } from 'lucide-react'
import { Button } from '@/components/admin/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/admin/ui/card'
import InvoiceTable from '@/components/admin/contractors/InvoiceTable'
import TotalsCards from '@/components/admin/contractors/TotalsCards'
import {
  formatCents,
  formatDate,
  formatWeek,
  type ContractorAgreement,
  type ContractorInvoice,
  type CurrentWeek,
  type InvoiceTotals,
} from '@/components/admin/contractors/lib'

export default function AdminMyContractShow({
  agreement,
  current_week,
  invoices,
  totals,
}: {
  agreement: ContractorAgreement
  current_week: CurrentWeek
  invoices: ContractorInvoice[]
  totals: InvoiceTotals
}) {
  const needsSignature = invoices.filter((invoice) => invoice.status === 'pending_signature').length

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <FileSignature className="size-5" />
            My Contract
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Signed {formatDate(agreement.signed_at)} · reviews count from {formatDate(agreement.billable_from)} ·{' '}
            {formatCents(agreement.rates.approve)} approve / {formatCents(agreement.rates.return)} return /{' '}
            {formatCents(agreement.rates.reject)} reject
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/admin/contractor_agreements/${agreement.id}`}>View contract</Link>
        </Button>
      </div>

      {needsSignature > 0 && (
        <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
          {needsSignature} invoice{needsSignature === 1 ? '' : 's'} waiting for your signature.
        </div>
      )}

      <TotalsCards
        totals={totals}
        extra={{ label: `This week (${current_week.review_count} reviews)`, value: formatCents(current_week.total_cents) }}
      />
      <p className="text-xs text-muted-foreground -mt-3">
        This week: {formatWeek(current_week.week_start, current_week.week_end)} (Eastern Time). Its invoice is generated
        next Monday.
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <InvoiceTable invoices={invoices} />
        </CardContent>
      </Card>
    </div>
  )
}
