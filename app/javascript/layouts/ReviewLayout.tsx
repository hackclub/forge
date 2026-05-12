import { useEffect } from 'react'
import type { ReactNode } from 'react'
import FlashMessages from '@/components/FlashMessages'
import { useAdminDark } from '@/hooks/useAdminDark'
import { cn } from '@/components/admin/lib/cn'

export default function ReviewLayout({ children }: { children: ReactNode }) {
  const [dark] = useAdminDark()

  useEffect(() => {
    document.title = 'Forge Review'
  }, [])

  return (
    <div className={cn('admin bg-background text-foreground min-h-screen flex flex-col', dark && 'dark')}>
      <FlashMessages />
      {children}
    </div>
  )
}
