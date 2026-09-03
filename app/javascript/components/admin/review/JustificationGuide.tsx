import { useState } from 'react'
import { ArrowRight, BookOpen, Check, Copy, X } from 'lucide-react'
import { cn } from '@/components/admin/lib/cn'
import type { JustificationGuide as Guide } from './types'

/**
 * Worked examples, in answer to: "i do fear the review here due to the lack of
 * examples and the primary feeling of being unsure whether the reviews do
 * actually pass".
 *
 * Every bad example is a justification that was really fined, shown with the
 * fine it earned and a rewrite that would have passed — so the standard is
 * demonstrated rather than described.
 */
export function JustificationGuide({ guide, onUseExample }: { guide: Guide; onUseExample?: (text: string) => void }) {
  const [active, setActive] = useState(0)
  const example = guide.examples[active]

  return (
    <div className="space-y-3">
      <div className="rounded-md border border-border bg-card">
        <div className="flex items-center gap-1.5 border-b border-border px-3 py-2">
          <BookOpen className="size-3.5 text-muted-foreground" />
          <span className="text-xs font-semibold">What a passing justification contains</span>
        </div>
        <ol className="divide-y divide-border/60">
          {guide.anatomy.map((part, i) => (
            <li key={part.part} className="flex gap-2 px-3 py-2">
              <span className="font-mono text-[11px] text-muted-foreground">{i + 1}</span>
              <span className="min-w-0">
                <span className="block text-xs font-medium">{part.part}</span>
                <span className="block text-[11px] text-muted-foreground">{part.detail}</span>
              </span>
            </li>
          ))}
        </ol>
        {guide.journal_only && (
          <p className="border-t border-border px-3 py-2 text-[11px] text-muted-foreground">
            This project is journal-tracked rather than Hackatime-tracked, which the handbook treats as needing an
            explicit note on your tracking method — and raises the bar on the hours.
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-1">
        {guide.examples.map((ex, i) => (
          <button
            key={ex.key}
            type="button"
            onClick={() => setActive(i)}
            className={cn(
              'rounded border px-2 py-1 text-[11px] transition-colors cursor-pointer',
              i === active
                ? 'border-foreground/30 bg-muted font-medium'
                : 'border-border text-muted-foreground hover:bg-muted/40',
            )}
          >
            {ex.text.length > 28 ? `${ex.text.slice(0, 28)}…` : ex.text}
          </button>
        ))}
      </div>

      {example && (
        <div className="space-y-2">
          <div className="rounded-md border border-red-600/40 bg-red-500/5 p-3">
            <div className="flex items-center gap-1.5">
              <X className="size-3.5 text-red-600 dark:text-red-400" />
              <span className="text-[11px] font-semibold uppercase tracking-wide text-red-700 dark:text-red-300">
                Fined
              </span>
            </div>
            <p className="mt-1 font-mono text-xs">“{example.text}”</p>
            <p className="mt-1.5 text-[11px] text-muted-foreground">{example.why}</p>
            <p className="mt-1.5 border-t border-red-600/20 pt-1.5 text-[11px] italic text-muted-foreground">
              The fine: {example.fine}
            </p>
          </div>

          <div className="flex justify-center">
            <ArrowRight className="size-3.5 rotate-90 text-muted-foreground" />
          </div>

          <div className="rounded-md border border-emerald-600/40 bg-emerald-500/5 p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <Check className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                  Would pass
                </span>
              </div>
              {onUseExample && (
                <button
                  type="button"
                  onClick={() => onUseExample(example.fixed)}
                  title="Copy this shape into the justification field to edit"
                  className="flex items-center gap-1 rounded border border-border bg-background px-1.5 py-0.5 text-[10px] text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <Copy className="size-2.5" />
                  Use as a starting point
                </button>
              )}
            </div>
            <p className="mt-1 text-xs leading-relaxed">{example.fixed}</p>
          </div>
        </div>
      )}
    </div>
  )
}
