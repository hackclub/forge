import { AlertTriangle } from 'lucide-react'

export function AgedOutBanner({ members }: { members: { display_name: string; aged_out_on: string }[] }) {
  if (members.length === 0) return null

  return (
    <div className="bg-amber-500/10 border-b border-amber-500/40 px-4 py-2 flex flex-col gap-1 text-sm text-amber-700 dark:text-amber-400 shrink-0">
      {members.map((m) => (
        <div key={m.display_name} className="flex items-center gap-2">
          <AlertTriangle className="size-4 shrink-0" />
          <span>
            {m.display_name} turned 19 on {m.aged_out_on} — check that all time tracked was before then.
          </span>
        </div>
      ))}
    </div>
  )
}
