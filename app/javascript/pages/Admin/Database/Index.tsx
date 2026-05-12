import { useState } from 'react'
import { Loader2, Database as DatabaseIcon } from 'lucide-react'
import { Button } from '@/components/admin/ui/button'
import { Card, CardContent } from '@/components/admin/ui/card'
import { Textarea } from '@/components/admin/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/admin/ui/table'
import { cn } from '@/components/admin/lib/cn'

interface QueryResult {
  columns: string[]
  rows: (string | number | boolean | null)[][]
  row_count: number
}

interface ErrorResult {
  error: string
}

export default function AdminDatabaseIndex({ tables }: { tables: string[] }) {
  const [sql, setSql] = useState('')
  const [result, setResult] = useState<QueryResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedTable, setSelectedTable] = useState<string | null>(null)

  const csrfToken = typeof document !== 'undefined'
    ? document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content || ''
    : ''

  async function runQuery(query?: string) {
    const q = query ?? sql
    if (!q.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch('/admin/database/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
        body: JSON.stringify({ sql: q }),
      })
      const data: QueryResult | ErrorResult = await res.json()
      if ('error' in data) setError(data.error)
      else setResult(data)
    } catch (e) {
      setError('Request failed')
    } finally {
      setLoading(false)
    }
  }

  function selectTable(table: string) {
    setSelectedTable(table)
    const query = `SELECT * FROM ${table} LIMIT 50`
    setSql(query)
    runQuery(query)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      runQuery()
    }
  }

  return (
    <div className="max-w-[1600px] mx-auto space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
        <DatabaseIcon className="size-5" />
        Database Console
      </h1>

      <div className="flex gap-4">
        <Card className="w-56 shrink-0 overflow-hidden">
          <div className="px-3 py-2 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Tables
          </div>
          <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
            {tables.map((table) => (
              <button
                key={table}
                onClick={() => selectTable(table)}
                className={cn(
                  'w-full text-left px-3 py-1.5 text-sm transition-colors cursor-pointer border-b border-border/50 last:border-b-0',
                  selectedTable === table
                    ? 'bg-accent text-accent-foreground font-medium'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                )}
              >
                {table}
              </button>
            ))}
          </div>
        </Card>

        <div className="flex-1 min-w-0 space-y-4">
          <Card>
            <CardContent className="pt-4 space-y-3">
              <Textarea
                value={sql}
                onChange={(e) => setSql(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="SELECT * FROM users LIMIT 10"
                className="font-mono min-h-[120px]"
                rows={5}
              />
              <div className="flex items-center gap-2">
                <Button onClick={() => runQuery()} disabled={loading}>
                  {loading ? <Loader2 className="size-4 animate-spin" /> : null}
                  {loading ? 'Running…' : 'Run Query'}
                </Button>
                <span className="text-xs text-muted-foreground">⌘+Enter to run</span>
              </div>
            </CardContent>
          </Card>

          {error && (
            <Card className="border-destructive/40 bg-destructive/5">
              <CardContent className="p-4 text-sm font-mono text-destructive">{error}</CardContent>
            </Card>
          )}

          {result && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                {result.row_count} row{result.row_count !== 1 ? 's' : ''} returned
              </p>
              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {result.columns.map((col) => (
                          <TableHead key={col} className="whitespace-nowrap">
                            {col}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.rows.map((row, i) => (
                        <TableRow key={i}>
                          {row.map((cell, j) => (
                            <TableCell
                              key={j}
                              className="font-mono text-xs whitespace-nowrap max-w-xs truncate"
                              title={String(cell ?? '')}
                            >
                              {cell === null ? <span className="text-muted-foreground italic">NULL</span> : String(cell)}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
