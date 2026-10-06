import { useState } from 'react'
import { router } from '@inertiajs/react'
import { KeyRound, Landmark, PlugZap, Trash2, Unplug } from 'lucide-react'
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

interface HcbStatus {
  configured: boolean
  connected: boolean
  org_slug: string
  org_url: string
  account_name: string | null
  account_email: string | null
  connected_at: string | null
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

function HcbCard({ hcb }: { hcb: HcbStatus }) {
  const status = !hcb.configured
    ? { label: 'Missing client credentials', variant: 'destructive' as const }
    : hcb.connected
      ? { label: 'Connected', variant: 'success' as const }
      : { label: 'Not connected', variant: 'secondary' as const }

  function testConnection() {
    router.post('/auth/hcb/test')
  }

  function disconnect() {
    if (!confirm('Disconnect HCB? Grants will have to be created by hand until it is reconnected.')) return
    router.delete('/auth/hcb')
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>HCB</CardTitle>
        {hcb.connected && (
          <Button variant="outline" size="sm" onClick={testConnection}>
            <PlugZap className="size-4" />
            Test connection
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Status</span>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Organization</span>
            <a href={hcb.org_url} target="_blank" rel="noopener noreferrer" className="font-mono hover:underline">
              {hcb.org_slug}
            </a>
          </div>
          {hcb.connected && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Connected as</span>
              <span>
                {hcb.account_name}
                {hcb.account_email && <span className="text-muted-foreground"> · {hcb.account_email}</span>}
              </span>
            </div>
          )}
          {hcb.connected_at && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Connected on</span>
              <span>{hcb.connected_at}</span>
            </div>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          Card grants for approved orders are created through the HCB API on behalf of this account, which must be a
          manager of the {hcb.org_slug} organization. Access tokens are stored encrypted and refreshed automatically.
          {!hcb.configured && ' Set HCB_CLIENT_ID and HCB_CLIENT_SECRET to enable connecting.'}
        </p>

        <div className="flex gap-2">
          {hcb.configured ? (
            <Button asChild>
              <a href="/auth/hcb/start">
                <Landmark className="size-4" />
                {hcb.connected ? 'Reconnect HCB' : 'Connect HCB'}
              </a>
            </Button>
          ) : (
            <Button disabled>
              <Landmark className="size-4" />
              Connect HCB
            </Button>
          )}
          {hcb.connected && (
            <Button type="button" variant="outline" onClick={disconnect}>
              <Unplug className="size-4 text-destructive" />
              Disconnect
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default function AdminApiKeysShow({ providers, hcb }: { providers: Provider[]; hcb: HcbStatus }) {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">API Keys</h1>

      {providers.map((provider) => (
        <ProviderCard key={provider.id} provider={provider} />
      ))}

      <HcbCard hcb={hcb} />
    </div>
  )
}
