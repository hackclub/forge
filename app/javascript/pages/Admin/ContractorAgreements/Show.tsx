import { Printer } from 'lucide-react'
import { Button } from '@/components/admin/ui/button'
import { Card, CardContent } from '@/components/admin/ui/card'
import ContractText from '@/components/admin/contractors/ContractText'
import { formatDate, type ContractorAgreement } from '@/components/admin/contractors/lib'

export default function AdminContractorAgreementShow({ agreement }: { agreement: ContractorAgreement }) {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex justify-end print:hidden">
        <Button variant="outline" onClick={() => window.print()}>
          <Printer />
          Print
        </Button>
      </div>

      <Card className="print:border-none print:shadow-none">
        <CardContent className="p-6 space-y-8">
          <ContractText rates={agreement.rates} />

          <div className="border-t border-border pt-4 grid sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Name</p>
              <p className="font-medium">{agreement.signed_name}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Signature</p>
              <p className="font-medium italic">/s/ {agreement.signed_name}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Date</p>
              <p className="font-medium">{formatDate(agreement.signed_at)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Email</p>
              <p className="font-medium">{agreement.signed_email ?? '—'}</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Contract version {agreement.contract_version}</p>
        </CardContent>
      </Card>
    </div>
  )
}
