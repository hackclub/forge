import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, router } from '@inertiajs/react'
import { ArrowLeft } from 'lucide-react'
import { Badge } from '@/components/admin/ui/badge'
import { Button } from '@/components/admin/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/admin/ui/card'
import { Input } from '@/components/admin/ui/input'
import { Label } from '@/components/admin/ui/label'
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

function AgreementForm({ agreement }: { agreement: ContractorAgreement }) {
  const [form, setForm] = useState({
    billable_from: agreement.billable_from,
    approve_rate: (agreement.rates.approve / 100).toFixed(2),
    return_rate: (agreement.rates.return / 100).toFixed(2),
    reject_rate: (agreement.rates.reject / 100).toFixed(2),
  })
  const [processing, setProcessing] = useState(false)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    router.patch(`/admin/contractor_agreements/${agreement.id}`, form, {
      preserveScroll: true,
      onStart: () => setProcessing(true),
      onFinish: () => setProcessing(false),
    })
  }

  const fields: { key: keyof typeof form; label: string; type: string }[] = [
    { key: 'billable_from', label: 'Billable from', type: 'date' },
    { key: 'approve_rate', label: 'Approve rate ($)', type: 'number' },
    { key: 'return_rate', label: 'Return rate ($)', type: 'number' },
    { key: 'reject_rate', label: 'Reject rate ($)', type: 'number' },
  ]

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid sm:grid-cols-4 gap-3">
        {fields.map((field) => (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key}>{field.label}</Label>
            <Input
              id={field.key}
              type={field.type}
              step={field.type === 'number' ? '0.01' : undefined}
              min={field.type === 'number' ? '0' : undefined}
              value={form[field.key]}
              onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
            />
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Changes apply to the current week and any invoice not yet signed. Moving the billable-from date earlier
        generates invoices for past weeks.
      </p>
      <Button type="submit" disabled={processing}>
        Save
      </Button>
    </form>
  )
}

export default function AdminContractorShow({
  contractor,
  agreement,
  current_week,
  invoices,
  totals,
}: {
  contractor: { id: number; display_name: string; email: string; avatar: string; active: boolean }
  agreement: ContractorAgreement | null
  current_week: CurrentWeek | null
  invoices: ContractorInvoice[]
  totals: InvoiceTotals
}) {
  const markAllPaid = () => {
    if (!confirm(`Mark all signed invoices (${formatCents(totals.owed_cents)}) as paid?`)) return
    router.post(`/admin/contractors/${contractor.id}/mark_all_paid`)
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/admin/contractors">
          <ArrowLeft />
          Contractors
        </Link>
      </Button>

      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <img src={contractor.avatar} alt="" className="size-10 rounded-full" />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
              <Link href={`/admin/users/${contractor.id}`} className="hover:underline">
                {contractor.display_name}
              </Link>
              {!contractor.active && <Badge variant="outline">Permission removed</Badge>}
            </h1>
            <p className="text-sm text-muted-foreground">{contractor.email}</p>
          </div>
        </div>
        {agreement && (
          <Button variant="outline" asChild>
            <Link href={`/admin/contractor_agreements/${agreement.id}`}>View contract</Link>
          </Button>
        )}
      </div>

      <TotalsCards
        totals={totals}
        extra={
          current_week
            ? { label: `This week (${current_week.review_count} reviews)`, value: formatCents(current_week.total_cents) }
            : undefined
        }
      />
      {current_week && (
        <p className="text-xs text-muted-foreground -mt-3">
          Current week: {formatWeek(current_week.week_start, current_week.week_end)} (Eastern Time).
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Contract</CardTitle>
        </CardHeader>
        <CardContent>
          {agreement ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Signed by <span className="text-foreground font-medium">{agreement.signed_name}</span> on{' '}
                {formatDate(agreement.signed_at)} (version {agreement.contract_version}).
              </p>
              <AgreementForm agreement={agreement} />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Hasn't signed their contract yet. Reviews aren't tracked until they do.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Invoices</CardTitle>
          {totals.owed_cents > 0 && (
            <Button size="sm" onClick={markAllPaid}>
              Mark all signed paid
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-0">
          <InvoiceTable invoices={invoices} canMarkPaid canDelete />
        </CardContent>
      </Card>
    </div>
  )
}
