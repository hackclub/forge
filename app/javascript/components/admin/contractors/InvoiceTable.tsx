import { Link, router } from '@inertiajs/react'
import { Button } from '@/components/admin/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/admin/ui/table'
import InvoiceStatusBadge from './InvoiceStatusBadge'
import { formatCents, formatWeek, type ContractorInvoice } from './lib'

export default function InvoiceTable({
  invoices,
  canMarkPaid = false,
  canDelete = false,
}: {
  invoices: ContractorInvoice[]
  canMarkPaid?: boolean
  canDelete?: boolean
}) {
  const deleteInvoice = (invoice: ContractorInvoice) => {
    if (!confirm(`Delete the invoice for ${formatWeek(invoice.week_start, invoice.week_end)}?`)) return
    router.delete(`/admin/contractor_invoices/${invoice.id}`, { preserveScroll: true })
  }

  if (invoices.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-10 text-center">
        No invoices yet. One is generated every Monday for the week before.
      </p>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Week</TableHead>
          <TableHead>Reviews</TableHead>
          <TableHead>Total</TableHead>
          <TableHead>Status</TableHead>
          {(canMarkPaid || canDelete) && <TableHead />}
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map((invoice) => (
          <TableRow key={invoice.id}>
            <TableCell className="font-medium">
              <Link href={`/admin/contractor_invoices/${invoice.id}`} className="hover:underline">
                {formatWeek(invoice.week_start, invoice.week_end)}
              </Link>
            </TableCell>
            <TableCell>{invoice.review_count}</TableCell>
            <TableCell className="font-mono">{formatCents(invoice.total_cents)}</TableCell>
            <TableCell>
              <InvoiceStatusBadge status={invoice.status} />
            </TableCell>
            {(canMarkPaid || canDelete) && (
              <TableCell className="text-right space-x-2">
                {canMarkPaid && invoice.status === 'signed' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => router.post(`/admin/contractor_invoices/${invoice.id}/mark_paid`)}
                  >
                    Mark paid
                  </Button>
                )}
                {canDelete && (
                  <Button size="sm" variant="destructive" onClick={() => deleteInvoice(invoice)}>
                    Delete
                  </Button>
                )}
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
