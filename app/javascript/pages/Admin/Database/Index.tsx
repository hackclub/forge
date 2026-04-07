import { useState } from 'react'

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

  const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content || ''

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
      if ('error' in data) {
        setError(data.error)
      } else {
        setResult(data)
      }
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
    <div className="p-12 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-headline font-bold text-[#e5e2e1] tracking-tight">Database Console</h1>
      </div>

      <div className="flex gap-6">
        <div className="w-56 shrink-0">
          <h2 className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-500 mb-3">Tables</h2>
          <div className="ghost-border bg-[#1c1b1b] overflow-hidden">
            {tables.map((table) => (
              <button
                key={table}
                onClick={() => selectTable(table)}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors cursor-pointer border-b border-white/5 last:border-b-0 ${
                  selectedTable === table
                    ? 'bg-[#ee671c]/10 text-[#ffb595]'
                    : 'text-stone-400 hover:bg-[#2a2a2a] hover:text-[#e5e2e1]'
                }`}
              >
                {table}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 min-w-0 space-y-4">
          <div className="ghost-border bg-[#1c1b1b] p-4">
            <textarea
              value={sql}
              onChange={(e) => setSql(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full bg-[#0e0e0e] border-none px-4 py-3 text-[#e5e2e1] focus:ring-1 focus:ring-[#ee671c]/30 placeholder:text-stone-600 text-sm font-mono resize-y min-h-[100px]"
              placeholder="SELECT * FROM users LIMIT 10"
              rows={4}
            />
            <div className="flex gap-3 mt-3">
              <button
                onClick={() => runQuery()}
                disabled={loading}
                className="signature-smolder text-[#4c1a00] px-6 py-3 font-bold uppercase tracking-wider text-xs cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Running...' : 'Run Query'}
              </button>
              <span className="text-stone-600 text-xs self-center ml-2">⌘+Enter to run</span>
            </div>
          </div>

          {error && (
            <div className="border border-red-500/20 bg-red-500/5 px-5 py-4 text-red-400 text-sm font-mono">
              {error}
            </div>
          )}

          {result && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-stone-500 text-xs">{result.row_count} row{result.row_count !== 1 ? 's' : ''} returned</span>
              </div>
              <div className="ghost-border overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/5">
                      {result.columns.map((col) => (
                        <th key={col} className="text-left px-4 py-3 text-[10px] uppercase tracking-[0.2em] font-bold text-stone-600 whitespace-nowrap">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.rows.map((row, i) => (
                      <tr key={i} className="border-b border-white/5 hover:bg-[#1c1b1b] transition-colors">
                        {row.map((cell, j) => (
                          <td key={j} className="px-4 py-3 text-sm text-stone-400 font-mono whitespace-nowrap max-w-xs truncate" title={String(cell ?? '')}>
                            {cell === null ? <span className="text-stone-600 italic">NULL</span> : String(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
