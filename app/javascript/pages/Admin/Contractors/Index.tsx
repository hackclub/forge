import { Link } from '@inertiajs/react'
import { Receipt } from 'lucide-react'
import { Badge } from '@/components/admin/ui/badge'
import { Card, CardContent } from '@/components/admin/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/admin/ui/table'
import TotalsCards from '@/components/admin/contractors/TotalsCards'
import { formatCents, formatDate, type InvoiceTotals } from '@/components/admin/contractors/lib'

interface ContractorRow {
  id: number
  display_name: string
  email: string
  avatar: string
  active: boolean
  signed_at: string | null
  billable_from: string | null
  awaiting_signature_cents: number
  owed_cents: number
  paid_cents: number
}

export default function AdminContractorsIndex({
  contractors,
  totals,
}: {
  contractors: ContractorRow[]
  totals: InvoiceTotals
}) {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <Receipt className="size-5" />
          Contractors
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Users with the Contractor permission, their signed contracts, and weekly invoices.
        </p>
      </div>

      <TotalsCards totals={totals} extra={{ label: 'Contractors', value: String(contractors.length) }} />

      <Card>
        <CardContent className="p-0">
          {contractors.length === 0 ? (
            <p className="text-sm text-muted-foreground py-10 text-center">
              No contractors yet. Grant the Contractor permission from a user's page.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contractor</TableHead>
                  <TableHead>Contract</TableHead>
                  <TableHead>Billable from</TableHead>
                  <TableHead>Awaiting signature</TableHead>
                  <TableHead>Signed, unpaid</TableHead>
                  <TableHead>Paid</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contractors.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/admin/contractors/${c.id}`}
                        className="inline-flex items-center gap-2 hover:underline"
                      >
                        <img src={c.avatar} alt="" className="size-6 rounded-full" />
                        {c.display_name}
                      </Link>
                      {!c.active && (
                        <Badge variant="outline" className="ml-2">
                          Permission removed
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {c.signed_at ? (
                        <Badge variant="success">Signed {formatDate(c.signed_at)}</Badge>
                      ) : (
                        <Badge variant="warning">Not signed</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {c.billable_from ? formatDate(c.billable_from) : '—'}
                    </TableCell>
                    <TableCell className="font-mono">{formatCents(c.awaiting_signature_cents)}</TableCell>
                    <TableCell className="font-mono">{formatCents(c.owed_cents)}</TableCell>
                    <TableCell className="font-mono text-muted-foreground">{formatCents(c.paid_cents)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
