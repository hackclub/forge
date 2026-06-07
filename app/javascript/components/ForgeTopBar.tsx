import { Link, usePage } from '@inertiajs/react'
import type { SharedProps } from '@/types'
import FireIcon from '@/components/FireIcon'

export default function ForgeTopBar() {
  const shared = usePage<SharedProps>().props
  const user = shared.auth.user
  const csrfToken =
    typeof document !== 'undefined'
      ? document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content || ''
      : ''

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-3 border-b border-white/5 bg-[#1C1B1B] px-4">
      <Link
        href={user ? '/home' : '/'}
        className="group flex items-center gap-2 font-headline text-sm font-bold uppercase tracking-tight text-[#ca5924] transition-all hover:brightness-110"
      >
        <span className="material-symbols-outlined text-xl transition-transform group-hover:-translate-x-0.5">
          arrow_back
        </span>
        <FireIcon className="text-xl" />
        <span className="hidden sm:inline">Back to the Forge</span>
      </Link>

      <div className="flex items-center gap-2">
        {user?.is_staff && (
          <Link
            href="/admin"
            className="corner-accents flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-stone-500 transition-colors hover:text-[#ffb595]"
          >
            <span className="material-symbols-outlined text-base">admin_panel_settings</span>
            <span className="hidden sm:inline">Admin</span>
          </Link>
        )}

        {user ? (
          <>
            {user.current_streak > 0 && (
              <span
                className="flex items-center gap-1 bg-[#ca5924]/10 px-2 py-1 text-[#ffb595]"
                title={`${user.current_streak} day streak`}
              >
                <FireIcon className="text-base" />
                <span className="font-headline text-xs font-bold">{user.current_streak}</span>
              </span>
            )}
            <Link href="/settings" className="group flex items-center gap-2" title="Settings">
              <img src={user.avatar} alt={user.display_name} className="h-8 w-8 rounded-full border border-white/10" />
              <span className="hidden font-headline text-xs font-bold text-[#e5e2e1] transition-colors group-hover:text-[#ffb595] md:inline">
                {user.display_name}
              </span>
            </Link>
            <form action={shared.sign_out_path} method="post">
              <input type="hidden" name="_method" value="delete" />
              <input type="hidden" name="authenticity_token" value={csrfToken} />
              <button
                type="submit"
                title="Sign out"
                className="flex cursor-pointer items-center bg-[#0e0e0e] p-2 text-stone-400 ghost-border transition-colors hover:text-[#ffb595]"
              >
                <span className="material-symbols-outlined text-lg">logout</span>
              </button>
            </form>
          </>
        ) : (
          <a
            href={shared.sign_in_path}
            className="signature-smolder flex items-center gap-2 px-4 py-2 font-headline text-xs font-bold uppercase tracking-wider text-[#4c1a00]"
          >
            <span className="material-symbols-outlined text-base">login</span>
            Sign In
          </a>
        )}
      </div>
    </header>
  )
}
