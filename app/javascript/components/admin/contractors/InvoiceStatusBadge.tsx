import { Badge } from '@/components/admin/ui/badge'
import type { InvoiceStatus } from './lib'

export default function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  if (status === 'paid') return <Badge variant="success">Paid</Badge>
  if (status === 'signed') return <Badge variant="secondary">Signed</Badge>
  return <Badge variant="warning">Needs signature</Badge>
}
