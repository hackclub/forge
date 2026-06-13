import { useState } from 'react'
import type { ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/components/admin/lib/cn'

export function CollapsibleSection({
  title,
  summary,
  defaultOpen = true,
  storageKey,
  children,
}: {
  title: string
  summary?: ReactNode
  defaultOpen?: boolean
  storageKey?: string
  children: ReactNode
}) {
  const [open, setOpen] = useState(() => {
    if (storageKey) {
      try {
        const stored = localStorage.getItem(`review:${storageKey}`)
        if (stored !== null) return stored === '1'
      } catch {}
    }
    return defaultOpen
  })
  const toggle = () =>
    setOpen((v) => {
      const next = !v
      if (storageKey) {
        try {
          localStorage.setItem(`review:${storageKey}`, next ? '1' : '0')
        } catch {}
      }
      return next
    })
  return (
    <div className="rounded-md border border-border overflow-hidden bg-card">
      <button
        type="button"
        onClick={toggle}
        className="w-full flex items-center gap-2 px-3 py-2 bg-muted/50 hover:bg-muted/80 transition-colors cursor-pointer text-left"
      >
        <span className="text-sm font-semibold shrink-0">{title}</span>
        {summary && <span className="text-xs text-muted-foreground flex-1 min-w-0 truncate">{summary}</span>}
        {!summary && <span className="flex-1" />}
        <ChevronDown
          className={cn('size-3.5 shrink-0 text-muted-foreground transition-transform', !open && '-rotate-90')}
        />
      </button>
      {open && <div>{children}</div>}
    </div>
  )
}
