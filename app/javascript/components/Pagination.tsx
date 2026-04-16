import { router } from '@inertiajs/react'
import type { PagyProps } from '@/types'

export default function Pagination({ pagy }: { pagy: PagyProps }) {
  function goToPage(pageNum: number) {
    const url = new URL(window.location.href)
    url.searchParams.set('page', String(pageNum))
    router.get(url.pathname + url.search, {}, { preserveState: true })
  }

  if (pagy.pages <= 1) return null

  const pages: (number | '...')[] = []
  for (let i = 1; i <= pagy.pages; i++) {
    if (i === 1 || i === pagy.pages || (i >= pagy.page - 1 && i <= pagy.page + 1)) {
      pages.push(i)
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...')
    }
  }

  return (
    <nav className="flex justify-center items-center gap-2 mt-10">
      <button
        onClick={() => pagy.prev && goToPage(pagy.prev)}
        disabled={!pagy.prev}
        className="w-10 h-10 rounded-lg bg-[#2a2a2a] border border-white/5 flex items-center justify-center text-stone-400 hover:text-white transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <span className="material-symbols-outlined text-sm">chevron_left</span>
      </button>
      <div className="flex gap-2">
        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`dots-${i}`} className="text-stone-600 px-2 flex items-end mb-2">...</span>
          ) : (
            <button
              key={p}
              onClick={() => goToPage(p)}
              className={`w-10 h-10 rounded-lg font-headline font-bold transition-colors cursor-pointer ${
                p === pagy.page
                  ? 'signature-smolder text-[#4c1a00]'
                  : 'bg-[#2a2a2a] border border-white/5 text-stone-400 hover:text-white'
              }`}
            >
              {p}
            </button>
          ),
        )}
      </div>
      <button
        onClick={() => pagy.next && goToPage(pagy.next)}
        disabled={!pagy.next}
        className="w-10 h-10 rounded-lg bg-[#2a2a2a] border border-white/5 flex items-center justify-center text-stone-400 hover:text-white transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <span className="material-symbols-outlined text-sm">chevron_right</span>
      </button>
    </nav>
  )
}
