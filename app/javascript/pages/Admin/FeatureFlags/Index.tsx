import { useState } from 'react'
import { router } from '@inertiajs/react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/admin/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/admin/ui/card'
import { Input } from '@/components/admin/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/admin/ui/table'
import { Badge } from '@/components/admin/ui/badge'

interface Flag {
  id: number
  name: string
  description: string | null
  enabled: boolean
  updated_at: string
}

export default function AdminFeatureFlagsIndex({ flags }: { flags: Flag[] }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [showForm, setShowForm] = useState(false)

  function createFlag(e: React.FormEvent) {
    e.preventDefault()
    router.post('/admin/feature_flags', { feature_flag: { name, description, enabled: false } })
    setName('')
    setDescription('')
    setShowForm(false)
  }

  function toggle(id: number) {
    router.post(`/admin/feature_flags/${id}/toggle`)
  }

  function destroy(id: number, flagName: string) {
    if (!confirm(`Delete flag "${flagName}"?`)) return
    router.delete(`/admin/feature_flags/${id}`)
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Feature Flags</h1>
        <Button onClick={() => setShowForm((v) => !v)}>
          <Plus className="size-4" />
          New Flag
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>New Feature Flag</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={createFlag} className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Name</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. new_feature_enabled"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Description</label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What does this flag control?"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit">Create</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          {flags.length === 0 ? (
            <p className="text-sm text-muted-foreground py-12 text-center">No feature flags. Create one above.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Flag</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="w-12 text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {flags.map((flag) => (
                  <TableRow key={flag.id}>
                    <TableCell className="font-mono text-sm">{flag.name}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{flag.description || '—'}</TableCell>
                    <TableCell>
                      <button onClick={() => toggle(flag.id)} className="cursor-pointer">
                        {flag.enabled ? <Badge variant="success">Enabled</Badge> : <Badge variant="secondary">Disabled</Badge>}
                      </button>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">{flag.updated_at}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => destroy(flag.id, flag.name)} title="Delete">
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </TableCell>
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
