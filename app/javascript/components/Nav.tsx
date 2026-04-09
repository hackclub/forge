import { usePage, router, Link } from '@inertiajs/react'
import type { SharedProps } from '@/types'

const navItems = [
  { href: '/explore', label: 'Explore', icon: 'explore', authOnly: false },
  { href: '/home', label: 'Dashboard', icon: 'dashboard', authOnly: true },
  { href: '/docs', label: 'Resources', icon: 'menu_book', authOnly: false },
]

export default function Nav() {
  const shared = usePage<SharedProps>().props
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : ''

  function signOut(e: React.MouseEvent) {
    e.preventDefault()
    router.delete(shared.sign_out_path)
  }

  const visibleItems = navItems.filter(
    (item) => !item.authOnly || shared.auth.user,
  )

  return (
    <aside className="h-screen w-64 fixed left-0 top-0 border-r border-white/5 bg-[#1C1B1B] shadow-2xl flex flex-col p-6 justify-between z-50">
      <div className="space-y-10">
        <div className="flex flex-col gap-1">
          <Link href={shared.auth.user ? '/home' : '/'} className="flex items-center gap-2">
            <span className="text-2xl font-bold tracking-tighter text-[#FFB595] uppercase font-headline">Forge</span>
          </Link>
        </div>

        <nav className="flex flex-col gap-1">
          {visibleItems.map((item) => {
            const isActive = currentPath === item.href || currentPath.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-3 flex items-center gap-3 transition-all duration-150 font-headline font-medium tracking-tight corner-accents ${
                  isActive
                    ? 'text-[#FFB595] bg-[#353534]'
                    : 'text-stone-500 hover:text-stone-200 hover:bg-[#353534]'
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
                  ? 'text-[#FFB595] bg-[#353534]'
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
              className="w-full signature-smolder text-[#4c1a00] font-headline font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined text-lg">add</span>
              <span>New Project</span>
            </Link>
            <div className="flex items-center gap-3 px-2">
              <img
                src={shared.auth.user.avatar}
                alt={shared.auth.user.display_name}
                className="w-10 h-10 rounded-full border border-white/10 shrink-0"
              />
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs font-bold text-[#e5e2e1] truncate">{shared.auth.user.display_name}</span>
                <button
                  onClick={signOut}
                  className="text-[10px] text-stone-500 uppercase tracking-wider text-left hover:text-stone-300 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
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
  )
}
