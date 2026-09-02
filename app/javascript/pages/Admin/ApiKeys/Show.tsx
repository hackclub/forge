import { useState } from 'react'
import { router } from '@inertiajs/react'
import { KeyRound, PlugZap, Trash2 } from 'lucide-react'
import { Button } from '@/components/admin/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/admin/ui/card'
import { Input } from '@/components/admin/ui/input'
import { Badge } from '@/components/admin/ui/badge'

interface Provider {
  id: string
  label: string
  credential_source: string
  model: string | null
  token_saved_at: string | null
}

const SOURCE_LABELS: Record<string, { label: string; variant: 'success' | 'secondary' | 'destructive' }> = {
  env_api_key: { label: 'API key (env)', variant: 'success' },
  admin_token: { label: 'OAuth token (saved here)', variant: 'success' },
  admin_key: { label: 'Key (saved here)', variant: 'success' },
  env_auth_token: { label: 'OAuth token (env)', variant: 'secondary' },
  none: { label: 'Not configured', variant: 'destructive' },
}

function ProviderCard({ provider }: { provider: Provider }) {
  const [token, setToken] = useState('')
  const [saving, setSaving] = useState(false)
  const source = SOURCE_LABELS[provider.credential_source] ?? SOURCE_LABELS.none

  function reauth(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    router.post(
      `/admin/api_keys/${provider.id}`,
      { token },
      {
        onFinish: () => {
          setSaving(false)
          setToken('')
        },
      },
    )
  }

  function testConnection() {
    router.post(`/admin/api_keys/${provider.id}/test`)
  }

  function clearToken() {
    if (!confirm(`Clear the saved ${provider.label} key?`)) return
    router.delete(`/admin/api_keys/${provider.id}`)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{provider.label}</CardTitle>
        <Button variant="outline" size="sm" onClick={testConnection}>
          <PlugZap className="size-4" />
          Test connection
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Credentials</span>
            <Badge variant={source.variant}>{source.label}</Badge>
          </div>
          {provider.model && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Model</span>
              <span className="font-mono">{provider.model}</span>
            </div>
          )}
          {provider.token_saved_at && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Key last saved</span>
              <span>{provider.token_saved_at}</span>
            </div>
          )}
        </div>

        <form onSubmit={reauth} className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">New key</label>
            <Input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Paste a new key…"
              autoComplete="off"
              required
            />
            <p className="text-xs text-muted-foreground">
              Verified before it's saved, then used for all {provider.label} requests. Stored encrypted and never shown
              again.
            </p>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={saving || !token.trim()}>
              <KeyRound className="size-4" />
              {saving ? 'Verifying…' : 'Verify & save'}
            </Button>
            {provider.credential_source !== 'none' && provider.credential_source !== 'env_api_key' && (
              <Button type="button" variant="outline" onClick={clearToken}>
                <Trash2 className="size-4 text-destructive" />
                Clear saved key
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export default function AdminApiKeysShow({ providers }: { providers: Provider[] }) {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">API Keys</h1>

      {providers.map((provider) => (
        <ProviderCard key={provider.id} provider={provider} />
      ))}
    </div>
  )
}
