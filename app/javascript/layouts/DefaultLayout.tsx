import type { ReactNode } from 'react'
import { usePage } from '@inertiajs/react'
import Nav from '@/components/Nav'
import FlashMessages from '@/components/FlashMessages'
import type { SharedProps } from '@/types'

export default function DefaultLayout({ children }: { children: ReactNode }) {
  const { maintenance_mode, auth } = usePage<SharedProps>().props
  const showBanner = maintenance_mode && auth.user?.is_staff

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-[#e5e2e1]">
      <Nav />
      <main className="md:ml-64 min-h-screen pt-14 md:pt-0">
        {showBanner && (
          <div className="bg-amber-500/15 border-b border-amber-500/30 px-5 py-2 flex items-center justify-center gap-2 text-amber-300 text-xs font-bold uppercase tracking-wider">
            <span className="material-symbols-outlined text-sm">construction</span>
            Maintenance mode is active - only staff can access the site right now
          </div>
        )}
        <FlashMessages />
        {children}
      </main>
    </div>
  )
}
