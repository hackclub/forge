import { useEffect, useRef, useState } from 'react'
import { router, usePage } from '@inertiajs/react'

export function useForgeData<T>(key: string): { data: T | null; loading: boolean } {
  const live = (usePage().props as Record<string, unknown>)[key] as T | undefined
  const [cached, setCached] = useState<T | null>(live ?? null)
  const requested = useRef(false)

  useEffect(() => {
    if (live === undefined && !requested.current) {
      requested.current = true
      router.reload({ only: [key] })
    }
  }, [live, key])

  useEffect(() => {
    if (live !== undefined) setCached(live)
  }, [live])

  return { data: cached, loading: cached === null }
}

export function ForgeLoading() {
  return (
    <div className="flex items-center justify-center py-20">
      <span className="material-symbols-outlined animate-spin text-3xl text-[#ca5924]">progress_activity</span>
    </div>
  )
}
