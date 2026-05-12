import { Link, router } from '@inertiajs/react'
import { RefreshCw, Database, AlertTriangle, Send, ExternalLink } from 'lucide-react'
import { Badge } from '@/components/admin/ui/badge'
import { Button } from '@/components/admin/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/admin/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/admin/ui/table'

interface ProjectRow {
  id: number
  name: string
  user_display_name: string | null
  status: string
  reviewed_at: string | null
  created_at: string
}

export default function AdminAirtableSyncIndex({
  checked_at,
  airtable_enabled,
  missing,
  orphan,
  counts,
}: {
  checked_at: string | null
  airtable_enabled: boolean
  missing: ProjectRow[]
  orphan: ProjectRow[]
  counts: { approved: number | null; airtable: number | null }
}) {
  function recheck() {
    router.post('/admin/airtable_sync/recheck')
  }

  function requeue(id: number) {
    router.post(`/admin/airtable_sync/requeue/${id}`)
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Database className="size-5" />
            Airtable Sync
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Compares approved Forge projects with the records in Airtable. Flags anything missing or orphan.
          </p>
        </div>
        <Button variant="outline" onClick={recheck}>
          <RefreshCw className="size-4" />
          Recheck now
        </Button>
      </div>

      {!airtable_enabled && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="p-3 text-sm text-destructive">
            Airtable is not configured. Set `AIRTABLE_API_KEY` and `AIRTABLE_BASE_ID` to enable sync.
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Last checked</p>
            <p className="text-sm mt-1">{checked_at || 'never'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Forge approved</p>
            <p className="text-2xl font-semibold mt-1">{counts.approved ?? '—'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">In Airtable</p>
            <p className="text-2xl font-semibold mt-1">{counts.airtable ?? '—'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Drift</p>
            <p className="text-2xl font-semibold mt-1">{missing.length + orphan.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400" />
            Approved but missing from Airtable
            <Badge variant="warning">{missing.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {missing.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Nothing missing — everything is in sync.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-14">ID</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Approved</TableHead>
                  <TableHead className="text-right w-40"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {missing.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="text-muted-foreground text-sm">{p.id}</TableCell>
                    <TableCell className="font-medium">
                      <Link href={`/admin/projects/${p.id}`} className="hover:underline">
                        {p.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{p.user_display_name || '—'}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{p.reviewed_at || '—'}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" onClick={() => requeue(p.id)}>
                        <Send className="size-3.5" />
                        Send to Airtable
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="size-4" />
            In Airtable but not approved locally
            <Badge variant="secondary">{orphan.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {orphan.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No orphans.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-14">ID</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Local status</TableHead>
                  <TableHead className="text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orphan.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="text-muted-foreground text-sm">{p.id}</TableCell>
                    <TableCell className="font-medium">
                      <Link href={`/admin/projects/${p.id}`} className="hover:underline">
                        {p.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{p.user_display_name || '—'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{p.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      Investigate manually — record exists in Airtable but project isn't approved here.
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
