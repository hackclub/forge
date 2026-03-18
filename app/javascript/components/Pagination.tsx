import { router } from '@inertiajs/react'
import type { PagyProps } from '@/types'

export default function Pagination({ pagy }: { pagy: PagyProps }) {
  function goToPage(pageNum: number) {
    const url = new URL(window.location.href)
    url.searchParams.set('page', String(pageNum))
    router.get(url.pathname + url.search, {}, { preserveState: true })
  }

  if (pagy.pages <= 1) return null

  return (
    <nav className="flex items-center gap-2 mt-6">
      {pagy.prev && (
        <button onClick={() => goToPage(pagy.prev!)} className="border border-yellow-800/40 hover:border-yellow-600/50 text-yellow-100/40 hover:text-yellow-400 font-bold uppercase tracking-wider px-3 py-1">
          Previous
        </button>
      )}
      <span className="text-sm text-yellow-100/30">
        Page {pagy.page} of {pagy.pages}
      </span>
      {pagy.next && (
        <button onClick={() => goToPage(pagy.next!)} className="border border-yellow-800/40 hover:border-yellow-600/50 text-yellow-100/40 hover:text-yellow-400 font-bold uppercase tracking-wider px-3 py-1">
          Next
        </button>
      )}
    </nav>
  )
}
