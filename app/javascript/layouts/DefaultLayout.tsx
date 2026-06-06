import type { ReactNode } from 'react'
import { usePage } from '@inertiajs/react'
import Nav from '@/components/Nav'
import ForgeTopBar from '@/components/ForgeTopBar'
import FlashMessages from '@/components/FlashMessages'
import OnboardingModal from '@/components/OnboardingModal'
import type { SharedProps } from '@/types'

export default function DefaultLayout({ children }: { children: ReactNode }) {
  const { maintenance_mode, auth, forge_ui_enabled } = usePage<SharedProps>().props
  const showBanner = maintenance_mode && auth.user?.is_staff
  const showOnboarding = !!auth.user?.needs_onboarding && !auth.user?.is_banned

  const banner = showBanner ? (
    <div className="flex items-center justify-center gap-2 border-b border-amber-500/30 bg-amber-500/15 px-5 py-2 text-xs font-bold uppercase tracking-wider text-amber-300">
      <span className="material-symbols-outlined text-sm">construction</span>
      Maintenance mode is active - only staff can access the site right now
    </div>
  ) : null

  if (!forge_ui_enabled) {
    return (
      <div className="min-h-screen bg-[#0E0E0E] text-[#e5e2e1]">
        <Nav />
        <main className="min-h-screen pt-14 md:ml-64 md:pt-0">
          {banner}
          <FlashMessages />
          {children}
        </main>
        {showOnboarding && <OnboardingModal />}
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-[#0e0e0e] text-[#e5e2e1]">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center"
        style={{ backgroundImage: 'linear-gradient(rgba(14,10,7,0.5), rgba(14,10,7,0.5)), url(/def-bg.png)' }}
      />
      <div className="relative z-10">
        <ForgeTopBar />
        <main className="min-h-screen">
          {banner}
          <FlashMessages />
          {children}
        </main>
        {showOnboarding && <OnboardingModal />}
      </div>
    </div>
  )
}
