import { useEffect, useState } from 'react'
import { usePage, router, Link } from '@inertiajs/react'
import type { SharedProps } from '@/types'

const navItems = [
  { href: '/explore', label: 'Explore', icon: 'explore', authOnly: false, tour: 'nav-explore', flag: undefined },
  { href: '/feed', label: 'Feed', icon: 'play_circle', authOnly: true, tour: undefined, flag: 'reels_enabled' },
  { href: '/home', label: 'Dashboard', icon: 'dashboard', authOnly: true, tour: 'nav-dashboard', flag: undefined },
  { href: '/shop', label: 'Shop', icon: 'storefront', authOnly: true, tour: 'nav-shop', flag: undefined },
  { href: '/leaderboard', label: 'Leaderboard', icon: 'emoji_events', authOnly: true, tour: undefined, flag: undefined },
  { href: '/news', label: 'News', icon: 'campaign', authOnly: true, tour: undefined, flag: undefined },
  { href: '/docs', label: 'Resources', icon: 'menu_book', authOnly: false, tour: 'nav-docs', flag: undefined },
]

export default function Nav() {
  const shared = usePage<SharedProps>().props
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : ''
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    setMobileOpen(false)
  }, [currentPath])

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  function signOut(e: React.MouseEvent) {
    e.preventDefault()
    router.delete(shared.sign_out_path)
  }

  const visibleItems = navItems.filter((item) => {
    if (item.authOnly && !shared.auth.user) return false
    if (item.flag && !shared[item.flag]) return false
    return true
  })

  return (
    <>
      <header className="md:hidden fixed top-0 left-0 right-0 h-14 bg-[#1C1B1B] border-b border-white/5 flex items-center justify-between px-4 z-50">
        <Link
          href={shared.auth.user ? '/home' : '/'}
          className="flex items-center gap-2 text-xl font-bold tracking-tighter uppercase font-headline text-[#ee671c]"
        >
          <span
            className="material-symbols-outlined text-2xl text-[#ee671c]"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            precision_manufacturing
          </span>
          <span>Forge</span>
        </Link>
        <button
          type="button"
          aria-label="Toggle navigation"
          onClick={() => setMobileOpen((v) => !v)}
          className="p-2 text-stone-300 hover:text-[#ee671c] transition-colors"
        >
          <span className="material-symbols-outlined text-3xl">{mobileOpen ? 'close' : 'menu'}</span>
        </button>
      </header>

      {mobileOpen && <div className="md:hidden fixed inset-0 bg-black/60 z-40" onClick={() => setMobileOpen(false)} />}

      <aside
        className={`h-screen w-64 fixed left-0 top-0 border-r border-white/5 bg-[#1C1B1B] shadow-2xl flex flex-col p-6 justify-between z-50 transition-transform duration-200 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}
      >
        <div className="space-y-10">
          <div className="hidden md:flex justify-center">
            <Link
              href={shared.auth.user ? '/home' : '/'}
              className="flex items-center gap-2 text-3xl font-bold tracking-tighter uppercase font-headline text-[#ee671c] hover:brightness-110 transition-all"
            >
              <span
                className="material-symbols-outlined text-4xl text-[#ee671c]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                precision_manufacturing
              </span>
              <span>Forge</span>
            </Link>
          </div>

          <nav className="flex flex-col gap-1 mt-14 md:mt-0">
            {visibleItems.map((item) => {
              const isActive = currentPath === item.href || currentPath.startsWith(item.href + '/')
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  data-tour={item.tour}
                  className={`px-4 py-3 flex items-center gap-3 transition-all duration-150 font-headline font-medium tracking-tight corner-accents ${
                    isActive ? 'text-[#ee671c] bg-[#353534]' : 'text-stone-500 hover:text-stone-200 hover:bg-[#353534]'
                  }`}
                >
                  <span
                    className="material-symbols-outlined text-xl"
                    style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
                  >
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </Link>
              )
            })}

            {shared.auth.user?.is_staff && (
              <Link
                href="/admin"
                className={`px-4 py-3 flex items-center gap-3 transition-all duration-150 font-headline font-medium tracking-tight corner-accents ${
                  currentPath.startsWith('/admin')
                    ? 'text-[#ee671c] bg-[#353534]'
                    : 'text-stone-500 hover:text-stone-200 hover:bg-[#353534]'
                }`}
              >
                <span
                  className="material-symbols-outlined text-xl"
                  style={currentPath.startsWith('/admin') ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  admin_panel_settings
                </span>
                <span>Admin</span>
              </Link>
            )}
          </nav>
        </div>

        <div className="space-y-4">
          {shared.auth.user ? (
            <>
              <Link
                href="/projects/new"
                data-tour="new-project"
                className="w-full signature-smolder text-[#4c1a00] font-headline font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 active:scale-95 transition-transform"
              >
                <span className="material-symbols-outlined text-lg">add</span>
                <span>New Project</span>
              </Link>
              <div className="flex items-center gap-3 px-2">
                <Link href="/settings" className="flex items-center gap-3 min-w-0 flex-1 group" title="Settings">
                  <img
                    src={shared.auth.user.avatar}
                    alt={shared.auth.user.display_name}
                    className="w-10 h-10 rounded-full border border-white/10 shrink-0"
                  />
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-xs font-bold text-[#e5e2e1] truncate group-hover:text-[#ffb595] transition-colors">
                      {shared.auth.user.display_name}
                    </span>
                    <span className="text-[10px] text-stone-600 uppercase tracking-wider">Settings</span>
                  </div>
                </Link>
                {shared.auth.user.current_streak > 0 && (
                  <span
                    data-tour="streak-target"
                    className="flex items-center gap-1 bg-[#ee671c]/10 text-[#ffb595] px-2 py-1 shrink-0"
                    title={`${shared.auth.user.current_streak} day streak`}
                  >
                    <span className="material-symbols-outlined text-base">local_fire_department</span>
                    <span className="text-xs font-bold font-headline">{shared.auth.user.current_streak}</span>
                  </span>
                )}
              </div>
              <button
                onClick={signOut}
                className="w-full ghost-border bg-[#0e0e0e] hover:bg-[#2a2a2a] text-stone-400 hover:text-[#ffb595] px-3 py-2 uppercase tracking-wider text-[10px] font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer corner-accents"
              >
                <span className="material-symbols-outlined text-sm">logout</span>
                Sign Out
              </button>
            </>
          ) : (
            <a
              href={shared.sign_in_path}
              className="w-full signature-smolder text-[#4c1a00] font-headline font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined text-lg">login</span>
              <span>Sign In</span>
            </a>
          )}
        </div>
      </aside>
    </>
  )
}
