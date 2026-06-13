export function FlagCards({ greenFlags, redFlags }: { greenFlags: string[]; redFlags: string[] }) {
  if (greenFlags.length === 0 && redFlags.length === 0) return null
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {greenFlags.length > 0 && (
        <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-3">
          <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide mb-1.5">
            Green flags
          </p>
          <ul className="space-y-1 text-sm">
            {greenFlags.map((g, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-emerald-600 dark:text-emerald-400">+</span>
                <span>{g}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {redFlags.length > 0 && (
        <div className="rounded-md border border-red-500/30 bg-red-500/5 p-3">
          <p className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wide mb-1.5">
            Red flags
          </p>
          <ul className="space-y-1 text-sm">
            {redFlags.map((r, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-red-600 dark:text-red-400">!</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
