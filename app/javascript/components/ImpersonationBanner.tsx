import { router, usePage } from '@inertiajs/react'
import type { SharedProps } from '@/types'

export default function ImpersonationBanner() {
  const { impersonation } = usePage<SharedProps>().props
  if (!impersonation) return null

  function stop() {
    router.delete(impersonation!.stop_path, { preserveScroll: false })
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-[100] flex items-center justify-center gap-3 border-t border-fuchsia-400/40 bg-fuchsia-700/95 px-5 py-2 text-sm text-fuchsia-50 shadow-[0_-4px_20px_rgba(0,0,0,0.4)] backdrop-blur">
      <span className="material-symbols-outlined text-base">visibility</span>
      <span className="font-medium">
        Viewing as <span className="font-bold">{impersonation.viewing_as ?? 'another user'}</span>
        {impersonation.impersonator && (
          <span className="hidden sm:inline text-fuchsia-200/80"> · you are {impersonation.impersonator}</span>
        )}
        <span className="ml-2 hidden md:inline text-xs text-fuchsia-200/70">acting on their behalf · can't spend their coins</span>
      </span>
      <button
        onClick={stop}
        className="ml-1 rounded-md bg-fuchsia-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-fuchsia-900 transition-colors hover:bg-white cursor-pointer"
      >
        Stop
      </button>
    </div>
  )
}
