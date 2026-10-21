import { useState } from 'react'
import type { FormEvent } from 'react'
import { router } from '@inertiajs/react'
import { FileSignature } from 'lucide-react'
import { Button } from '@/components/admin/ui/button'
import { Input } from '@/components/admin/ui/input'
import { Label } from '@/components/admin/ui/label'

export default function SignatureForm({
  action,
  agreement,
  submitLabel,
  extra,
}: {
  action: string
  agreement: string
  submitLabel: string
  extra?: Record<string, string | number>
}) {
  const [signedName, setSignedName] = useState('')
  const [agree, setAgree] = useState(false)
  const [processing, setProcessing] = useState(false)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    router.post(
      action,
      { signed_name: signedName, agree, ...extra },
      { onStart: () => setProcessing(true), onFinish: () => setProcessing(false) },
    )
  }

  return (
    <form onSubmit={submit} className="space-y-4 print:hidden">
      <div className="space-y-2">
        <Label htmlFor="signed_name">Full legal name</Label>
        <Input
          id="signed_name"
          value={signedName}
          onChange={(e) => setSignedName(e.target.value)}
          placeholder="Type your full legal name"
          autoComplete="name"
        />
      </div>
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" className="mt-0.5" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
        <span>{agreement}</span>
      </label>
      <Button type="submit" disabled={processing || !agree || signedName.trim() === ''}>
        <FileSignature />
        {submitLabel}
      </Button>
    </form>
  )
}
