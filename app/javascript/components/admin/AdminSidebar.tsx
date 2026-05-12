import { Link, usePage } from '@inertiajs/react'
import {
  LayoutDashboard,
  ClipboardCheck,
  Lightbulb,
  FolderOpen,
  Users,
  ScrollText,
  ShoppingCart,
  Store,
  Megaphone,
  Newspaper,
  Sparkles,
  Flag,
  LifeBuoy,
  Database,
  Activity,
  BarChart3,
  Briefcase,
  ChevronsLeft,
  ChevronsRight,
  LogOut,
  Sun,
  Moon,
  TableProperties,
  PlayCircle,
  DollarSign,
  FileText,
  Users2,
} from 'lucide-react'
import type { SharedProps } from '@/types'
import { cn } from './lib/cn'

interface AdminStats {
  pending_ships: number
  pending_pitches: number
  pending_project_reviews: number
  projects: number
  users: number
  pending_orders: number
  feature_flags: number
}

interface AdminPermissions {
  is_admin: boolean
  is_superadmin: boolean
  pending_reviews: boolean
  projects: boolean
  users: boolean
  ships: boolean
  feature_flags: boolean
  audit_log: boolean
  jobs: boolean
  third_party: boolean
  support: boolean
  news: boolean
  orders: boolean
  referrals: boolean
}

type PermKey = keyof AdminPermissions

interface NavItem {
  label: string
  href: string
  icon: typeof LayoutDashboard
  statKey?: keyof AdminStats
  external?: boolean
  permission?: PermKey
}

function buildSections(): { items: NavItem[] }[] {
  return [
    {
      items: [{ label: 'Dashboard', href: '/admin', icon: LayoutDashboard }],
    },
    {
      items: [
        { label: 'Project Reviews', href: '/admin/reviews', icon: ClipboardCheck, statKey: 'pending_project_reviews', permission: 'pending_reviews' },
        { label: 'Pitch Reviews', href: '/admin/pitches', icon: Lightbulb, statKey: 'pending_pitches', permission: 'pending_reviews' },
      ],
    },
    {
      items: [
        { label: 'Projects', href: '/admin/projects', icon: FolderOpen, statKey: 'projects', permission: 'projects' },
        { label: 'Users', href: '/admin/users', icon: Users, statKey: 'users', permission: 'users' },
        { label: 'Audit Log', href: '/admin/audit_log', icon: ScrollText, permission: 'audit_log' },
        { label: 'Support', href: '/admin/support', icon: LifeBuoy, permission: 'support' },
      ],
    },
    {
      items: [
        { label: 'Shop Orders', href: '/admin/orders', icon: ShoppingCart, statKey: 'pending_orders', permission: 'orders' },
        { label: 'Shop Items', href: '/admin/shop_items', icon: Store, permission: 'orders' },
        { label: 'Referrals', href: '/admin/referrals', icon: Users2, permission: 'referrals' },
        { label: 'News', href: '/admin/news_posts', icon: Newspaper, permission: 'news' },
        { label: 'RSVPs', href: '/admin/rsvps', icon: Sparkles, permission: 'is_admin' },
      ],
    },
    {
      items: [
        { label: 'Reel Ads', href: '/admin/reel_ads', icon: PlayCircle, permission: 'is_admin' },
        { label: 'Reel Payouts', href: '/admin/reel_payouts', icon: DollarSign, permission: 'is_superadmin' },
      ],
    },
    {
      items: [
        { label: 'Feature Flags', href: '/admin/feature_flags', icon: Flag, statKey: 'feature_flags', permission: 'feature_flags' },
        { label: 'Airtable Sync', href: '/admin/airtable_sync', icon: Database, permission: 'is_admin' },
        { label: 'Review Audits', href: '/admin/review_audits', icon: Activity, permission: 'is_superadmin' },
        { label: 'Metrics', href: '/admin/metrics', icon: BarChart3, permission: 'audit_log' },
        { label: 'Database', href: '/admin/database', icon: Database, permission: 'is_admin' },
        { label: 'Airtable Queue', href: '/admin/airtable_queue', icon: TableProperties, permission: 'is_superadmin' },
        { label: 'Jobs', href: '/admin/jobs', icon: Briefcase, external: true, permission: 'jobs' },
        { label: 'Sentry', href: 'https://sentry.io', icon: Activity, external: true, permission: 'third_party' },
      ],
    },
  ]
}

function NavLink({ item, pathname, collapsed, stats }: { item: NavItem; pathname: string; collapsed: boolean; stats?: AdminStats }) {
  const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
  const Icon = item.icon
  const stat = item.statKey && stats ? stats[item.statKey] : null
  const className = cn(
    'flex items-center gap-2 rounded-md px-2 py-1.5 h-8 text-sm whitespace-nowrap transition-colors',
    isActive
      ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
      : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
  )

  const inner = (
    <>
      <Icon className="size-4 shrink-0" />
      {!collapsed && (
        <>
          <span className="flex-1">{item.label}</span>
          {stat != null && stat > 0 && (
            <span className="text-[10px] leading-none font-medium rounded-full px-1.5 py-0.5 bg-muted text-muted-foreground">
              {stat}
            </span>
          )}
        </>
      )}
    </>
  )

  if (item.external) {
    return (
      <a href={item.href} target="_blank" rel="noopener noreferrer" title={item.label} className={className}>
        {inner}
      </a>
    )
  }

  return (
    <Link href={item.href} title={item.label} className={className}>
      {inner}
    </Link>
  )
}

export default function AdminSidebar({
  collapsed,
  onToggle,
  dark,
  onToggleDark,
}: {
  collapsed: boolean
  onToggle: () => void
  dark: boolean
  onToggleDark: () => void
}) {
  const { auth, admin_stats, admin_permissions } = usePage<
    SharedProps & { admin_stats?: AdminStats; admin_permissions?: AdminPermissions }
  >().props

  const perms: AdminPermissions = admin_permissions ?? {
    is_admin: auth.user?.is_admin ?? false,
    is_superadmin: auth.user?.is_superadmin ?? false,
    pending_reviews: false,
    projects: false,
    users: false,
    ships: false,
    feature_flags: false,
    audit_log: false,
    jobs: false,
    third_party: false,
    support: false,
    news: false,
    orders: false,
    referrals: false,
  }

  const pathname = typeof window !== 'undefined' ? window.location.pathname : ''

  const toggleCollapsed = onToggle
  const toggleDark = onToggleDark

  const iconBtn =
    'p-1 rounded hover:bg-sidebar-accent text-muted-foreground hover:text-sidebar-accent-foreground transition-colors cursor-pointer shrink-0'

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/30 transition-opacity duration-200',
          !collapsed ? 'opacity-100 pointer-events-auto sm:opacity-0 sm:pointer-events-none' : 'opacity-0 pointer-events-none',
        )}
        onClick={toggleCollapsed}
      />

      {collapsed && (
        <button
          onClick={toggleCollapsed}
          className="fixed top-3 left-3 z-30 sm:hidden p-1 rounded hover:bg-sidebar-accent text-muted-foreground transition-colors cursor-pointer"
          title="Expand sidebar"
        >
          <ChevronsRight className="size-4" />
        </button>
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 overflow-hidden border-r border-sidebar-border bg-sidebar text-sidebar-foreground flex flex-col transition-transform sm:transition-[width] duration-200 ease-in-out',
          collapsed ? '-translate-x-full sm:translate-x-0 w-56 sm:w-12' : 'translate-x-0 w-56',
        )}
      >
        <div className="flex items-center px-2.5 py-3 border-b border-sidebar-border">
          {!collapsed && (
            <Link href="/admin" className="text-sm font-semibold tracking-tight whitespace-nowrap flex-1 min-w-0 truncate">
              Forge Admin
            </Link>
          )}
          <button onClick={toggleCollapsed} className={iconBtn} title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
            {collapsed ? <ChevronsRight className="size-4" /> : <ChevronsLeft className="size-4" />}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-2 px-1.5">
          {buildSections().map((section, i) => {
            const visible = section.items.filter((item) => {
              if (!item.permission) return true
              return perms[item.permission]
            })
            if (visible.length === 0) return null
            return (
              <div key={i}>
                {i > 0 && <div className="my-2 mx-2 border-t border-sidebar-border" />}
                <div className="space-y-0.5">
                  {visible.map((item) => (
                    <NavLink key={item.href} item={item} pathname={pathname} collapsed={collapsed} stats={admin_stats} />
                  ))}
                </div>
              </div>
            )
          })}
        </nav>

        <div className="border-t border-sidebar-border overflow-hidden px-1.5 py-2">
          <div className="flex items-center gap-2 px-1 whitespace-nowrap">
            {auth.user && (
              <>
                <img src={auth.user.avatar} alt={auth.user.display_name} className="size-6 rounded-full shrink-0" />
                {!collapsed && <span className="text-xs text-muted-foreground truncate flex-1">{auth.user.display_name}</span>}
              </>
            )}
            {!auth.user && <div className="flex-1" />}
            {!collapsed && (
              <>
                <Link href="/home" title="Leave admin" className={iconBtn}>
                  <LogOut className="size-4" />
                </Link>
                <button
                  onClick={toggleDark}
                  className={iconBtn}
                  title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                  {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
                </button>
              </>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}
