import { useState } from 'react'
import { router } from '@inertiajs/react'
import { Upload, Loader2 } from 'lucide-react'
import { Button } from '@/components/admin/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/admin/ui/card'
import { Badge } from '@/components/admin/ui/badge'

interface ImportedRow {
  macondo_project_id: string
  name: string | null
  email: string
  devlogs: number
}

interface SkippedRow {
  macondo_project_id: string | null
  email?: string
  message?: string
}

interface LastRun {
  ran_at: string
  actor: string | null
  filename: string | null
  imported: ImportedRow[]
  already_imported: number
  missing_owners: SkippedRow[]
  missing_collaborators: SkippedRow[]
  failures: SkippedRow[]
}

function RowList({ label, rows }: { label: string; rows: SkippedRow[] }) {
  if (rows.length === 0) return null

  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium">
        {label} <span className="text-muted-foreground">({rows.length})</span>
      </p>
      <ul className="max-h-60 space-y-1 overflow-y-auto rounded-md bg-muted/40 p-3 font-mono text-xs">
        {rows.map((row, index) => (
          <li key={`${row.macondo_project_id}-${index}`} className="truncate">
            {row.macondo_project_id ?? '—'}: {row.email ?? row.message}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function AdminMacondoImportShow({
  last_run,
  queued_at,
  max_megabytes,
  stats,
}: {
  last_run: LastRun | null
  queued_at: string | null
  max_megabytes: number
  stats: { imported: number; awaiting_tier_confirmation: number }
}) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  function upload(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return
    setUploading(true)
    router.post(
      '/admin/macondo_import',
      { file },
      {
        forceFormData: true,
        onFinish: () => {
          setUploading(false)
          setFile(null)
        },
      },
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Macondo Import</h1>

      <Card>
        <CardHeader>
          <CardTitle>Upload a CSV export</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Each row becomes a draft project owned by the builder with that email, with every journal entry imported as
            a devlog. Projects land on tier 4 and the builder reconfirms their Forge tier from a prompt on the project
            page. Rows already imported are skipped, so re-running the same file is safe. Nothing is read from the
            Macondo API.
          </p>

          <div className="flex gap-6 text-sm">
            <div>
              <span className="text-muted-foreground">Imported so far</span>
              <p className="font-mono text-lg">{stats.imported}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Awaiting tier confirmation</span>
              <p className="font-mono text-lg">{stats.awaiting_tier_confirmation}</p>
            </div>
          </div>

          <form onSubmit={upload} className="space-y-3">
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm file:mr-3 file:border-0 file:bg-muted file:px-3 file:py-2 file:text-sm"
            />
            <p className="text-xs text-muted-foreground">Max {max_megabytes}MB. The upload is deleted once it runs.</p>
            <Button type="submit" disabled={!file || uploading}>
              <Upload className="size-4" />
              {uploading ? 'Uploading…' : 'Queue import'}
            </Button>
          </form>

          {queued_at && (
            <div className="flex items-center gap-2 rounded-md border border-border bg-muted/40 p-3 text-sm">
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
              Import queued at {queued_at}. Refresh this page for the results.
            </div>
          )}
        </CardContent>
      </Card>

      {last_run && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Last run</CardTitle>
            <Badge variant={last_run.failures.length > 0 ? 'destructive' : 'success'}>
              {last_run.imported.length} imported
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>
                {last_run.ran_at}
                {last_run.actor && <> · queued by {last_run.actor}</>}
                {last_run.filename && <> · {last_run.filename}</>}
              </p>
              <p>{last_run.already_imported} row(s) skipped as already imported.</p>
            </div>

            {last_run.imported.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-sm font-medium">
                  Imported <span className="text-muted-foreground">({last_run.imported.length})</span>
                </p>
                <ul className="max-h-60 space-y-1 overflow-y-auto rounded-md bg-muted/40 p-3 font-mono text-xs">
                  {last_run.imported.map((row) => (
                    <li key={row.macondo_project_id} className="truncate">
                      {row.macondo_project_id}: {row.name} → {row.email} ({row.devlogs} devlogs)
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <RowList label="No Forge account for the owner" rows={last_run.missing_owners} />
            <RowList label="No Forge account for a collaborator" rows={last_run.missing_collaborators} />
            <RowList label="Failed" rows={last_run.failures} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
