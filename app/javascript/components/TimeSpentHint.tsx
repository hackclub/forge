import { formatHours, parseTimeSpent } from '@/lib/timeSpent'

export default function TimeSpentHint({ value }: { value: string }) {
  if (!value.trim()) return null

  const hours = parseTimeSpent(value)
  if (hours === null) {
    return (
      <p className="text-xs text-amber-400 mt-1.5">Couldn&apos;t read this time — try something like 3h 30m or 3:30.</p>
    )
  }

  return (
    <p className="text-xs text-stone-500 mt-1.5">
      Counted as <span className="text-[#ffb595]">{formatHours(hours)}</span> ({hours} {hours === 1 ? 'hour' : 'hours'})
    </p>
  )
}
