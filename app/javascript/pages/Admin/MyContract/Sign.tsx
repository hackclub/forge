import { FileSignature } from 'lucide-react'
import { Card, CardContent } from '@/components/admin/ui/card'
import ContractText from '@/components/admin/contractors/ContractText'
import SignatureForm from '@/components/admin/contractors/SignatureForm'
import type { ContractorRates } from '@/components/admin/contractors/lib'

export default function AdminMyContractSign({
  signer,
  rates,
}: {
  signer: { display_name: string; email: string }
  rates: ContractorRates
}) {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <FileSignature className="size-5" />
          Reviewer Contract
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Read and sign your contract to start tracking paid reviews and weekly invoices.
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <ContractText rates={rates} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="text-sm text-muted-foreground">
            Signing as <span className="text-foreground font-medium">{signer.display_name}</span> ({signer.email})
          </div>
          <SignatureForm
            action="/admin/my_contract/sign"
            submitLabel="Sign contract"
            agreement="I have read this Agreement and agree to its terms. Typing my name above is my electronic signature."
          />
        </CardContent>
      </Card>
    </div>
  )
}
