import { createPortal } from 'react-dom'

const GROUPS: { title: string; items: [string, string][] }[] = [
  {
    title: 'Decisions',
    items: [
      ['A', 'Approve'],
      ['R', 'Return'],
      ['X', 'Reject'],
      ['D', 'Send to draft'],
      ['⌘/Ctrl ↵', 'Smart submit'],
    ],
  },
  {
    title: 'Navigation',
    items: [
      ['S', 'Skip to next'],
      ['E', 'End session'],
      ['1–7', 'Switch tab'],
    ],
  },
  {
    title: 'Open',
    items: [
      ['O then R', 'Repo'],
      ['O then U', 'User'],
      ['O then P', 'Public page'],
      ['O then C', 'Commits'],
    ],
  },
  {
    title: 'Editing & tools',
    items: [
      ['G then C', 'Focus conclusion'],
      ['G then F', 'Focus feedback'],
      ['C', 'Run AI check'],
      ['?', 'Toggle this help'],
      ['Esc', 'Close'],
    ],
  },
]

export function ShortcutCheatsheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open || typeof document === 'undefined') return null
  return createPortal(
    <div className="admin fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 w-full max-w-lg rounded-lg border border-border bg-background p-6 shadow-lg"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Keyboard shortcuts</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-sm cursor-pointer"
          >
            Esc
          </button>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
          {GROUPS.map((g) => (
            <div key={g.title}>
              <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-2">{g.title}</p>
              <ul className="space-y-1.5">
                {g.items.map(([k, label]) => (
                  <li key={k} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-muted-foreground">{label}</span>
                    <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[11px] font-mono text-foreground">
                      {k}
                    </kbd>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  )
}
