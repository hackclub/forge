import { router } from '@inertiajs/react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { PagyProps } from '@/types'
import { cn } from './lib/cn'

export default function AdminPagination({ pagy }: { pagy: PagyProps }) {
  if (pagy.pages <= 1) return null

  const goToPage = (n: number) => {
    const url = new URL(window.location.href)
    url.searchParams.set('page', String(n))
    router.get(url.pathname + url.search, {}, { preserveState: true })
  }

  const pages: (number | '...')[] = []
  for (let i = 1; i <= pagy.pages; i++) {
    if (i === 1 || i === pagy.pages || (i >= pagy.page - 1 && i <= pagy.page + 1)) {
      pages.push(i)
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...')
    }
  }

  const btn =
    'h-8 w-8 inline-flex items-center justify-center rounded-md border border-border bg-background text-foreground hover:bg-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer'

  return (
    <nav className="flex items-center gap-1.5 justify-center mt-4">
      <button onClick={() => pagy.prev && goToPage(pagy.prev)} disabled={!pagy.prev} className={btn}>
        <ChevronLeft className="size-4" />
      </button>
      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`dots-${i}`} className="text-muted-foreground px-2 text-sm">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => goToPage(p)}
            className={cn(
              'h-8 min-w-8 px-2 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors cursor-pointer',
              p === pagy.page
                ? 'bg-primary text-primary-foreground'
                : 'border border-border bg-background text-foreground hover:bg-accent',
            )}
          >
            {p}
          </button>
        ),
      )}
      <button onClick={() => pagy.next && goToPage(pagy.next)} disabled={!pagy.next} className={btn}>
        <ChevronRight className="size-4" />
      </button>
    </nav>
  )
}
