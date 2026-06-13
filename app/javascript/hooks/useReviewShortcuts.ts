import { useEffect, useRef } from 'react'

export interface ReviewShortcutHandlers {
  enabled: boolean
  onApprove: () => void
  onReturn: () => void
  onReject: () => void
  onDraft: () => void
  onSkip: () => void
  onEndSession: () => void
  focusReasoning: () => void
  focusFeedback: () => void
  openRepo: () => void
  openUser: () => void
  openPublic: () => void
  openCommits: () => void
  runAiCheck: () => void
  setTab: (value: string) => void
  tabValues: string[]
  smartSubmit: () => void
  toggleNotes: () => void
  toggleHelp: () => void
  closeOverlays: () => void
}

const CHORD_MS = 800

function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false
  const tag = el.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable
}

export function useReviewShortcuts(handlers: ReviewShortcutHandlers) {
  const ref = useRef(handlers)
  ref.current = handlers
  const chordRef = useRef<{ key: string; at: number } | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const fire = (e: KeyboardEvent, fn: () => void) => {
      e.preventDefault()
      fn()
    }

    const onKeyDown = (e: KeyboardEvent) => {
      const h = ref.current
      const mod = e.metaKey || e.ctrlKey
      const typing = isTypingTarget(e.target)

      if (mod && e.key === 'Enter') {
        if (!h.enabled) return
        e.preventDefault()
        h.smartSubmit()
        return
      }

      if (e.key === 'Escape') {
        h.closeOverlays()
        return
      }

      if (e.key === '?' && !typing) {
        e.preventDefault()
        h.toggleHelp()
        return
      }

      if (!h.enabled || typing || mod || e.altKey) return

      const now = Date.now()
      const chord = chordRef.current
      const active = chord && now - chord.at < CHORD_MS ? chord.key : null

      if (active === 'g') {
        chordRef.current = null
        if (e.key === 'c') return fire(e, h.focusReasoning)
        if (e.key === 'f') return fire(e, h.focusFeedback)
        return
      }
      if (active === 'o') {
        chordRef.current = null
        if (e.key === 'r') return fire(e, h.openRepo)
        if (e.key === 'u') return fire(e, h.openUser)
        if (e.key === 'p') return fire(e, h.openPublic)
        if (e.key === 'c') return fire(e, h.openCommits)
        return
      }

      if (e.key === 'g' || e.key === 'o') {
        chordRef.current = { key: e.key, at: now }
        return
      }
      chordRef.current = null

      if (e.key >= '1' && e.key <= '9') {
        const idx = Number(e.key) - 1
        if (idx < h.tabValues.length) return fire(e, () => h.setTab(h.tabValues[idx]))
        return
      }

      switch (e.key) {
        case 'a':
          return fire(e, h.onApprove)
        case 'r':
          return fire(e, h.onReturn)
        case 'x':
          return fire(e, h.onReject)
        case 'd':
          return fire(e, h.onDraft)
        case 's':
          return fire(e, h.onSkip)
        case 'e':
          return fire(e, h.onEndSession)
        case 'c':
          return fire(e, h.runAiCheck)
        case 'n':
          return fire(e, h.toggleNotes)
        default:
          return
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])
}
