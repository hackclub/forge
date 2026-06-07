import { useEffect, useRef, useState, type ReactNode } from 'react'
import FireIcon from '@/components/FireIcon'

const SIZES = {
  sm: 'max-w-md',
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
  xl: 'max-w-6xl',
} as const

export type ForgePopupSize = keyof typeof SIZES

interface ForgePopupProps {
  open: boolean
  onClose: () => void
  title?: ReactNode
  icon?: string
  size?: ForgePopupSize
  children: ReactNode
}

export default function ForgePopup({ open, onClose, title, icon, size = 'md', children }: ForgePopupProps) {
  const [mounted, setMounted] = useState(open)
  const [visible, setVisible] = useState(false)
  const panelRef = useRef<HTMLDivElement | null>(null)
  const triggerRef = useRef<HTMLElement | null>(null)
  const lastChildren = useRef<ReactNode>(children)
  if (open) lastChildren.current = children

  useEffect(() => {
    if (open) {
      triggerRef.current = document.activeElement as HTMLElement | null
      setMounted(true)
      const id = requestAnimationFrame(() => setVisible(true))
      return () => cancelAnimationFrame(id)
    }
    setVisible(false)
    const t = window.setTimeout(() => setMounted(false), 200)
    return () => window.clearTimeout(t)
  }, [open])

  useEffect(() => {
    if (!mounted) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [mounted])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    document.addEventListener('keydown', onKey)
    const focusId = requestAnimationFrame(() => panelRef.current?.focus())
    return () => {
      document.removeEventListener('keydown', onKey)
      cancelAnimationFrame(focusId)
    }
  }, [open, onClose])

  useEffect(() => {
    if (mounted) return
    const t = triggerRef.current
    if (t && typeof t.focus === 'function') t.focus()
  }, [mounted])

  if (!mounted) return null

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6">
      <div
        aria-hidden
        onClick={onClose}
        className={`absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-200 ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        style={{
          backgroundImage: 'linear-gradient(rgba(20,14,10,0.55), rgba(20,14,10,0.55)), url(/def-bg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
        className={`relative flex w-full ${SIZES[size]} max-h-[88vh] flex-col bg-[#1c1b1b] ghost-border corner-accents shadow-2xl outline-none transition-all duration-200 ${
          visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
      >
        {(title || icon) && (
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/5 px-5 py-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-2.5">
              {icon &&
                (icon === 'local_fire_department' ? (
                  <FireIcon className="text-2xl" />
                ) : (
                  <span
                    className="material-symbols-outlined shrink-0 text-2xl text-[#ca5924]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    {icon}
                  </span>
                ))}
              {title && (
                <h2 className="truncate font-headline text-lg font-bold tracking-tight text-[#e5e2e1] sm:text-xl">
                  {title}
                </h2>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="shrink-0 cursor-pointer p-1 text-stone-500 transition-colors hover:text-[#ffb595]"
            >
              <span className="material-symbols-outlined text-2xl">close</span>
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-5 sm:p-6">{open ? children : lastChildren.current}</div>
      </div>
    </div>
  )
}
