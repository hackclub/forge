import { useEffect, useState } from 'react'

const STORAGE_KEY = 'admin-dark'

function getInitialDark(): boolean {
  if (typeof window === 'undefined') return true
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored !== null) return stored === '1'
  } catch {}
  return true
}

export function useAdminDark(): [boolean, () => void] {
  const [dark, setDark] = useState<boolean>(() => getInitialDark())

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, dark ? '1' : '0')
    } catch {}
  }, [dark])

  return [dark, () => setDark((v) => !v)]
}
