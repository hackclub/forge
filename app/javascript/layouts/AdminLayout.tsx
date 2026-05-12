import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import FlashMessages from '@/components/FlashMessages'
import AdminSidebar from '@/components/admin/AdminSidebar'
import { useAdminDark } from '@/hooks/useAdminDark'
import { cn } from '@/components/admin/lib/cn'

function getInitialCollapsed(): boolean {
  if (typeof window === 'undefined') return false
  const isMobile = window.innerWidth < 640
  try {
    const stored = localStorage.getItem('admin-sidebar-collapsed')
    if (stored !== null) return stored !== '0'
  } catch {}
  return isMobile
}

export default function AdminLayout({ children, flush }: { children: ReactNode; flush?: boolean }) {
  const [dark, toggleDark] = useAdminDark()
  const [collapsed, setCollapsed] = useState<boolean>(() => getInitialCollapsed())

  useEffect(() => {
    document.title = 'Forge Admin'
  }, [])

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem('admin-sidebar-collapsed', next ? '1' : '0')
      } catch {}
      return next
    })
  }

  return (
    <div className={cn('admin bg-background text-foreground min-h-screen', dark && 'dark')}>
      <AdminSidebar collapsed={collapsed} onToggle={toggleCollapsed} dark={dark} onToggleDark={toggleDark} />
      <div
        className={cn(
          'pt-10 sm:pt-0 min-h-screen flex flex-col transition-[padding] duration-200 ease-in-out',
          collapsed ? 'sm:pl-12' : 'sm:pl-56',
        )}
      >
        <FlashMessages />
        <main className={flush ? 'flex-1 min-h-0 flex flex-col' : 'flex-1 p-6'}>{children}</main>
      </div>
    </div>
  )
}
