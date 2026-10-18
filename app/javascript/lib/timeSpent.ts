const round2 = (n: number) => Math.round(n * 100) / 100

// Mirrors lib/time_spent_parser.rb so the preview matches what the server stores.
export function parseTimeSpent(input: string): number | null {
  const value = input.trim().toLowerCase()
  if (!value) return null

  let m = value.match(/(\d+(?:\.\d+)?)\s*h(?:ours?)?\s*[,\s]*(\d+(?:\.\d+)?)\s*m?(?:in(?:utes?)?)?/)
  if (m) return round2(parseFloat(m[1]) + parseFloat(m[2]) / 60)

  m = value.match(/^(\d+):(\d+)$/)
  if (m) return round2(parseInt(m[1], 10) + parseInt(m[2], 10) / 60)

  m = value.match(/(\d+(?:\.\d+)?)\s*h(?:ours?)?/)
  if (m) return round2(parseFloat(m[1]))

  m = value.match(/(\d+(?:\.\d+)?)\s*m(?:in(?:utes?)?)?/)
  if (m) return round2(parseFloat(m[1]) / 60)

  if (/^\d+(?:\.\d+)?$/.test(value)) return round2(parseFloat(value))

  return null
}

export function formatHours(hours: number): string {
  const totalMinutes = Math.round(hours * 60)
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  if (h === 0) return `${m}m`
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}
