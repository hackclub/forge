import { Card, CardContent } from '@/components/admin/ui/card'
import { formatCents, type InvoiceTotals } from './lib'

export default function TotalsCards({ totals, extra }: { totals: InvoiceTotals; extra?: { label: string; value: string } }) {
  const cards = [
    ...(extra ? [extra] : []),
    { label: 'Awaiting signature', value: formatCents(totals.awaiting_signature_cents) },
    { label: 'Signed, unpaid', value: formatCents(totals.owed_cents) },
    { label: 'Paid', value: formatCents(totals.paid_cents) },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">{card.label}</p>
            <p className="text-2xl font-semibold mt-1">{card.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
