import { Link } from '@inertiajs/react'

interface AdminDashboardProps {
  user_name: string
  counts: {
    pending_reviews: number
    projects: number
    users: number
    ships: number
    feature_flags: number
    pending_orders: number
  }
  permissions: Record<string, boolean>
  is_admin: boolean
}

function DashboardLink({ href, label, external }: { href: string; label: string; external?: boolean }) {
  const cls = "ghost-border bg-[#1c1b1b] hover:bg-[#2a2a2a] px-6 py-4 text-sm font-headline font-bold uppercase tracking-[0.15em] text-stone-400 hover:text-[#e5e2e1] transition-colors text-center"

  if (external) {
    return <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>{label}</a>
  }
  return <Link href={href} className={cls}>{label}</Link>
}

export default function AdminStaticPagesIndex({ user_name, counts, permissions, is_admin }: AdminDashboardProps) {
  const can = (perm: string) => permissions[perm]

  return (
    <div className="p-12 max-w-5xl mx-auto space-y-12">
      <div>
        <Link href="/home" className="ghost-border inline-block px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-stone-500 hover:text-[#e5e2e1] transition-colors mb-6">
          Leave the mines
        </Link>
        <h1 className="text-4xl font-headline font-bold text-[#e5e2e1] tracking-tight">Admin Dashboard</h1>
        <p className="text-stone-500 mt-2">What are we forging today {user_name}?</p>
      </div>

      {(can('pending_reviews') || can('projects')) && (
        <div>
          <h2 className="text-xl font-headline font-bold text-[#e5e2e1] tracking-tight mb-4">Tasks</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {can('projects') && <DashboardLink href="/admin/projects?status=pending" label={`All Pending (${counts.pending_reviews})`} />}
            {can('pending_reviews') && <DashboardLink href="/admin/pitches" label="Pitch Reviews" />}
            {can('pending_reviews') && <DashboardLink href="/admin/reviews" label="Project Reviews" />}
          </div>
        </div>
      )}

      {(can('projects') || can('users') || can('support') || can('news') || can('orders')) && (
        <div>
          <h2 className="text-xl font-headline font-bold text-[#e5e2e1] tracking-tight mb-4">Dashboards</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {can('projects') && <DashboardLink href="/admin/projects" label={`Projects (${counts.projects})`} />}
            {can('users') && <DashboardLink href="/admin/users" label={`Users (${counts.users})`} />}
            {can('support') && <DashboardLink href="/admin/support" label="Support Tickets" />}
            {is_admin && <DashboardLink href="/admin/rsvps" label="RSVPs" />}
            {can('news') && <DashboardLink href="/admin/news_posts" label="News" />}
            {can('orders') && <DashboardLink href="/admin/orders" label={`Shop Orders (${counts.pending_orders})`} />}
            {can('orders') && <DashboardLink href="/admin/shop_items" label="Shop Items" />}
          </div>
        </div>
      )}

      {(can('feature_flags') || can('audit_log') || can('jobs') || is_admin) && (
        <div>
          <h2 className="text-xl font-headline font-bold text-[#e5e2e1] tracking-tight mb-4">Dev</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {can('feature_flags') && <DashboardLink href="/admin/feature_flags" label={`Feature Flags (${counts.feature_flags})`} />}
            {can('audit_log') && <DashboardLink href="/admin/audit_log" label="Audit Log" />}
            {is_admin && <DashboardLink href="/admin/database" label="Database" />}
            {can('jobs') && <DashboardLink href="/admin/jobs" label="Jobs" external />}
          </div>
        </div>
      )}

      {can('third_party') && (
        <div>
          <h2 className="text-xl font-headline font-bold text-[#e5e2e1] tracking-tight mb-4">3rd Party</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <DashboardLink href="https://sentry.io" label="Sentry" external />
          </div>
        </div>
      )}
    </div>
  )
}
