import { useEffect, useState } from 'react'

const STORAGE_KEY = 'forge-performance-mode'
const EVENT_NAME = 'forge-performance-mode-change'

function getInitialPerformanceMode(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored !== null) return stored === '1'
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return true
  } catch {}
  return false
}

export function usePerformanceMode(): [boolean, () => void] {
  const [performanceMode, setPerformanceMode] = useState<boolean>(() => getInitialPerformanceMode())

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, performanceMode ? '1' : '0')
    } catch {}

    if (performanceMode) {
      document.documentElement.classList.add('performance-mode')
    } else {
      document.documentElement.classList.remove('performance-mode')
    }

    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ enabled: boolean }>).detail
      if (detail && typeof detail.enabled === 'boolean') {
        setPerformanceMode(detail.enabled)
      }
    }
    window.addEventListener(EVENT_NAME, handler)
    return () => window.removeEventListener(EVENT_NAME, handler)
  }, [performanceMode])

  const toggle = () => {
    setPerformanceMode((prev) => {
      const next = !prev
      try {
        localStorage.setItem(STORAGE_KEY, next ? '1' : '0')
      } catch {}
      window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { enabled: next } }))
      return next
    })
  }

  return [performanceMode, toggle]
}
