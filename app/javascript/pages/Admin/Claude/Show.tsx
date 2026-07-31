import { useState } from 'react'
import { router } from '@inertiajs/react'
import { KeyRound, PlugZap, Trash2 } from 'lucide-react'
import { Button } from '@/components/admin/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/admin/ui/card'
import { Input } from '@/components/admin/ui/input'
import { Badge } from '@/components/admin/ui/badge'

interface Props {
  credential_source: 'env_api_key' | 'admin_token' | 'env_auth_token' | 'none'
  model: string
  token_saved_at: string | null
}

const SOURCE_LABELS: Record<Props['credential_source'], { label: string; variant: 'success' | 'secondary' | 'destructive' }> = {
  env_api_key: { label: 'API key (env)', variant: 'success' },
  admin_token: { label: 'OAuth token (saved here)', variant: 'success' },
  env_auth_token: { label: 'OAuth token (env)', variant: 'secondary' },
  none: { label: 'Not configured', variant: 'destructive' },
}

export default function AdminClaudeShow({ credential_source, model, token_saved_at }: Props) {
  const [token, setToken] = useState('')
  const [saving, setSaving] = useState(false)
  const source = SOURCE_LABELS[credential_source]

  function reauth(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    router.post('/admin/claude', { token }, {
      onFinish: () => {
        setSaving(false)
        setToken('')
      },
    })
  }

  function testConnection() {
    router.post('/admin/claude/test')
  }

  function clearToken() {
    if (!confirm('Clear the saved Claude token? Checks fall back to env credentials, if any.')) return
    router.delete('/admin/claude')
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Claude</h1>
        <Button variant="outline" onClick={testConnection}>
          <PlugZap className="size-4" />
          Test connection
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Credentials</span>
            <Badge variant={source.variant}>{source.label}</Badge>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Model</span>
            <span className="font-mono">{model}</span>
          </div>
          {token_saved_at && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Token last saved</span>
              <span>{token_saved_at}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reauth Claude</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={reauth} className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">New OAuth token</label>
              <Input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="sk-ant-oat01-..."
                autoComplete="off"
                required
              />
              <p className="text-xs text-muted-foreground">
                The token is verified against the Claude API before it's saved, then used for all AI checks. It's stored encrypted and never shown again.
              </p>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={saving || !token.trim()}>
                <KeyRound className="size-4" />
                {saving ? 'Verifying…' : 'Verify & save'}
              </Button>
              {credential_source === 'admin_token' && (
                <Button type="button" variant="outline" onClick={clearToken}>
                  <Trash2 className="size-4 text-destructive" />
                  Clear saved token
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
