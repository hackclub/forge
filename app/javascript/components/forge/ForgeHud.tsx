import { Link, usePage } from '@inertiajs/react'
import type { SharedProps } from '@/types'

const TEXT_SHADOW = { textShadow: '0 2px 10px rgba(0,0,0,0.85)' }

function Counter({
  icon,
  img,
  value,
  label,
  color,
}: {
  icon?: string
  img?: string
  value: number
  label: string
  color?: string
}) {
  return (
    <div className="group relative flex items-center gap-1">
      {img ? (
        <img
          src={img}
          alt=""
          className="h-7 w-7 object-contain xl:h-9 xl:w-9"
          style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.7))' }}
        />
      ) : (
        <span
          className="material-symbols-outlined text-2xl xl:text-3xl"
          style={{ color, fontVariationSettings: "'FILL' 1", filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.7))' }}
        >
          {icon}
        </span>
      )}
      <span
        className="font-mono text-2xl font-bold leading-none tabular-nums text-[#e3b24c] xl:text-3xl"
        style={TEXT_SHADOW}
      >
        {value}
      </span>
      <span className="pointer-events-none absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-[#1c1b1b] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-stone-300 opacity-0 ghost-border transition-opacity group-hover:opacity-100">
        {label}
      </span>
    </div>
  )
}

export default function ForgeHud({ coinBalance }: { coinBalance: number }) {
  const user = usePage<SharedProps>().props.auth.user
  if (!user) return null

  return (
    <>
      {user.is_staff && (
        <Link
          href="/admin"
          title="Admin dashboard"
          className="group absolute left-4 top-4 z-30 flex items-center gap-1.5 bg-[#1c1b1b]/90 px-3 py-2 corner-accents ghost-border transition-colors hover:bg-[#2a2a2a]"
        >
          <span
            className="material-symbols-outlined text-lg text-[#ca5924]"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            admin_panel_settings
          </span>
          <span className="font-headline text-[11px] font-bold uppercase tracking-wider text-stone-300 group-hover:text-[#ffb595]">
            Admin
          </span>
        </Link>
      )}

      <Link
        href="/settings"
        title="Settings"
        className="group absolute bottom-4 left-4 z-30 hidden items-center gap-3 md:flex"
      >
        <img
          src={user.avatar}
          alt={user.display_name}
          className="size-12 rounded-lg border-2 border-[#1c1b1b] shadow-lg"
        />
        <div style={TEXT_SHADOW}>
          <p className="font-headline text-base font-bold leading-tight text-[#f1e9df] transition-colors group-hover:text-[#ffb595]">
            {user.display_name}
          </p>
          <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-stone-400">
            <span className="material-symbols-outlined text-xs">settings</span>
            Settings
          </p>
        </div>
      </Link>

      <div className="absolute right-5 top-4 z-30 hidden items-center gap-4 md:flex xl:gap-5">
        <Counter img="/fire.png" value={user.current_streak} label="Day streak" />
        <Counter img="/coin.png" value={coinBalance} label="Steel coins" />
      </div>
    </>
  )
}
