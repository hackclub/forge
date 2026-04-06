import { Link } from '@inertiajs/react'

interface AdminDashboardProps {
  user_name: string
  counts: {
    pending_reviews: number
    projects: number
    users: number
    ships: number
    feature_flags: number
  }
}

function DashboardLink({ href, label, external }: { href: string; label: string; external?: boolean }) {
  const cls = "ghost-border bg-[#1c1b1b] hover:bg-[#2a2a2a] px-6 py-4 text-sm font-headline font-bold uppercase tracking-[0.15em] text-stone-400 hover:text-[#e5e2e1] transition-colors text-center"

  if (external) {
    return <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>{label}</a>
  }
  return <Link href={href} className={cls}>{label}</Link>
}

export default function AdminStaticPagesIndex({ user_name, counts }: AdminDashboardProps) {
  return (
    <div className="p-12 max-w-5xl mx-auto space-y-12">
      <div>
        <Link href="/home" className="ghost-border inline-block px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-stone-500 hover:text-[#e5e2e1] transition-colors mb-6">
          Leave the mines
        </Link>
        <h1 className="text-4xl font-headline font-bold text-[#e5e2e1] tracking-tight">Admin Dashboard</h1>
        <p className="text-stone-500 mt-2">What are we forging today {user_name}?</p>
      </div>

      <div>
        <h2 className="text-xl font-headline font-bold text-[#e5e2e1] tracking-tight mb-4">Tasks</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <DashboardLink href="/admin/projects?status=pending" label={`All Pending (${counts.pending_reviews})`} />
          <DashboardLink href="/admin/pitches" label="Pitch Reviews" />
          <DashboardLink href="/admin/reviews" label="Project Reviews" />
        </div>
      </div>

      <div>
        <h2 className="text-xl font-headline font-bold text-[#e5e2e1] tracking-tight mb-4">Dashboards</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <DashboardLink href="/admin/projects" label={`Projects (${counts.projects})`} />
          <DashboardLink href="/admin/users" label={`Users (${counts.users})`} />
          <DashboardLink href="/admin/rsvps" label="RSVPs" />
          <DashboardLink href="/admin/feature_flags" label={`Feature Flags (${counts.feature_flags})`} />
          <DashboardLink href="/admin/audit_log" label="Audit Log" />
          <DashboardLink href="/admin/database" label="Database" />
          <DashboardLink href="/admin/jobs" label="Jobs" external />
        </div>
      </div>

      <div>
        <h2 className="text-xl font-headline font-bold text-[#e5e2e1] tracking-tight mb-4">3rd Party</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <DashboardLink href="https://sentry.io" label="Sentry" external />
        </div>
      </div>
    </div>
  )
}
