import { usePage, router, Link } from '@inertiajs/react'
import type { SharedProps } from '@/types'

const navItems = [
  { href: '/home', label: 'Dashboard', authOnly: true },
  { href: '/explore', label: 'Explore', authOnly: false },
  { href: '/docs', label: 'Resources', authOnly: false },
  { href: '/vote', label: 'Vote', authOnly: true },
  { href: '/shop', label: 'Shop', authOnly: true },
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
    <aside className="fixed top-0 left-0 h-screen w-52 border-r border-yellow-900/20 bg-[#0b0a07] flex flex-col z-50">
      {/* Logo */}
      <div className="px-5 pt-6 pb-8">
        <Link href={shared.auth.user ? '/home' : '/'} className="flex items-center gap-2">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-yellow-600 shrink-0">
            <path d="M12 2L4 8V16L12 22L20 16V8L12 2Z" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.15" />
            <circle cx="12" cy="12" r="3" fill="currentColor" />
          </svg>
          <span className="text-sm font-black tracking-[0.25em] uppercase text-yellow-600">Quarry</span>
        </Link>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 space-y-1">
        {visibleItems.map((item) => {
          const isActive = currentPath === item.href || currentPath.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-3 py-2.5 text-sm font-bold uppercase tracking-wider transition-all text-center ${
                isActive
                  ? 'bg-yellow-700/15 border border-yellow-700/30 text-yellow-400'
                  : 'border border-transparent text-yellow-100/30 hover:text-yellow-100/60 hover:bg-yellow-900/10'
              }`}
            >
              {item.label}
            </Link>
          )
        })}

        {shared.auth.user?.is_admin && (
          <Link
            href="/admin"
            className={`block px-3 py-2.5 text-sm font-bold uppercase tracking-wider transition-all text-center ${
              currentPath.startsWith('/admin')
                ? 'bg-yellow-700/15 border border-yellow-700/30 text-yellow-400'
                : 'border border-transparent text-yellow-500/40 hover:text-yellow-500/70 hover:bg-yellow-900/10'
            }`}
          >
            Admin
          </Link>
        )}
      </nav>

      {/* User profile / Sign in */}
      <div className="px-3 pb-4 border-t border-yellow-900/20 pt-4">
        {shared.auth.user ? (
          <>
            <div className="flex items-center gap-2.5 px-2 mb-3">
              <img
                src={shared.auth.user.avatar}
                alt={shared.auth.user.display_name}
                className="w-8 h-8 border border-yellow-800/30 shrink-0"
              />
              <div className="min-w-0">
                <p className="text-yellow-100/70 text-xs font-bold truncate">{shared.auth.user.display_name}</p>
              </div>
            </div>
            <button
              onClick={signOut}
              className="w-full text-yellow-100/20 hover:text-yellow-100/40 text-xs uppercase tracking-wider font-bold transition-colors py-1.5 text-center"
            >
              Sign Out
            </button>
          </>
        ) : (
          <a
            href={shared.sign_in_path}
            className="block w-full bg-gradient-to-b from-yellow-600 to-yellow-800 hover:from-yellow-500 hover:to-yellow-700 text-[#1a1200] font-black py-2.5 text-xs uppercase tracking-widest transition-all text-center border border-yellow-500/30"
          >
            Sign In
          </a>
        )}
      </div>
    </aside>
  )
}
