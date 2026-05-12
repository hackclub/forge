import { useEffect, useRef, useState } from 'react'

const HEARTBEAT_INTERVAL_MS = 20_000
const IDLE_THRESHOLD_MS = 10 * 60 * 1000

function csrfToken(): string {
  if (typeof document === 'undefined') return ''
  return document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content || ''
}

export function useReviewHeartbeat(heartbeatPath: string | null, initialActiveSeconds: number) {
  const [activeSeconds, setActiveSeconds] = useState(initialActiveSeconds)
  const lastTickRef = useRef<number>(Date.now())
  const lastActivityRef = useRef<number>(Date.now())
  const accumulatedRef = useRef<number>(0)
  const visibleRef = useRef<boolean>(true)

  useEffect(() => {
    if (!heartbeatPath) return
    if (typeof window === 'undefined') return

    visibleRef.current = document.visibilityState === 'visible' && document.hasFocus()
    lastTickRef.current = Date.now()
    lastActivityRef.current = Date.now()

    const isActive = () => {
      const visible = document.visibilityState === 'visible' && document.hasFocus()
      const idle = Date.now() - lastActivityRef.current > IDLE_THRESHOLD_MS
      return visible && !idle
    }

    const checkpoint = () => {
      const wasActive = visibleRef.current
      const nowActive = isActive()
      if (wasActive) {
        accumulatedRef.current += Math.max(0, Math.floor((Date.now() - lastTickRef.current) / 1000))
      }
      lastTickRef.current = Date.now()
      visibleRef.current = nowActive
    }

    const markActivity = () => {
      const wasIdle = Date.now() - lastActivityRef.current > IDLE_THRESHOLD_MS
      lastActivityRef.current = Date.now()
      if (wasIdle) {
        lastTickRef.current = Date.now()
        visibleRef.current = document.visibilityState === 'visible' && document.hasFocus()
      }
    }

    const onVisibility = () => checkpoint()
    const activityEvents: Array<keyof DocumentEventMap | keyof WindowEventMap> = [
      'mousemove',
      'mousedown',
      'keydown',
      'wheel',
      'touchstart',
      'scroll',
    ]

    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('focus', onVisibility)
    window.addEventListener('blur', onVisibility)
    activityEvents.forEach((evt) => window.addEventListener(evt, markActivity, { passive: true }))

    const flush = async () => {
      checkpoint()
      const toSend = accumulatedRef.current
      if (toSend <= 0) return
      accumulatedRef.current = 0
      try {
        const res = await fetch(heartbeatPath, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'X-CSRF-Token': csrfToken(),
          },
          body: JSON.stringify({ seconds: toSend }),
        })
        if (res.ok) {
          const data = await res.json().catch(() => null)
          if (data && typeof data.active_seconds === 'number') {
            setActiveSeconds(data.active_seconds)
          } else {
            setActiveSeconds((s) => s + toSend)
          }
        } else {
          accumulatedRef.current += toSend
        }
      } catch {
        accumulatedRef.current += toSend
      }
    }

    const interval = window.setInterval(flush, HEARTBEAT_INTERVAL_MS)
    const onBeforeUnload = () => {
      checkpoint()
      const toSend = accumulatedRef.current
      if (toSend > 0) {
        accumulatedRef.current = 0
        navigator.sendBeacon?.(heartbeatPath, new Blob([JSON.stringify({ seconds: toSend })], { type: 'application/json' }))
      }
    }
    window.addEventListener('beforeunload', onBeforeUnload)

    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('focus', onVisibility)
      window.removeEventListener('blur', onVisibility)
      activityEvents.forEach((evt) => window.removeEventListener(evt, markActivity))
      window.removeEventListener('beforeunload', onBeforeUnload)
      window.clearInterval(interval)
      flush().catch(() => {})
    }
  }, [heartbeatPath])

  return activeSeconds
}

export function formatSeconds(s: number): string {
  if (s < 60) return `${s}s`
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return `${h}h ${m}m`
  return `${m}m ${sec}s`
}
