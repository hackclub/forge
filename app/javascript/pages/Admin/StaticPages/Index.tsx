import { Link, useForm } from '@inertiajs/react'
import {
  ArrowLeft,
  Hammer,
  Lightbulb,
  ClipboardCheck,
  FolderOpen,
  Users,
  LifeBuoy,
  Sparkles,
  Newspaper,
  ShoppingCart,
  Store,
  Users2,
  Flag,
  ScrollText,
  BarChart3,
  Database,
  Briefcase,
  PlayCircle,
  DollarSign,
  TableProperties,
  Activity,
  Coins,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/admin/ui/card'
import { Badge } from '@/components/admin/ui/badge'
import { Button } from '@/components/admin/ui/button'

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
  is_superadmin: boolean
}

function Tile({
  href,
  label,
  icon: Icon,
  badge,
  external,
}: {
  href: string
  label: string
  icon: LucideIcon
  badge?: number | string
  external?: boolean
}) {
  const inner = (
    <>
      <div className="flex items-center gap-3">
        <div className="rounded-md bg-muted p-2 text-foreground inline-flex items-center justify-center">
          <Icon className="size-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{label}</div>
        </div>
        {badge != null && (
          <Badge variant="secondary" className="ml-2">
            {badge}
          </Badge>
        )}
      </div>
    </>
  )

  const card = (
    <Card className="hover:bg-accent transition-colors cursor-pointer">
      <CardContent className="p-4">{inner}</CardContent>
    </Card>
  )

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {card}
      </a>
    )
  }
  return <Link href={href}>{card}</Link>
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">{children}</div>
    </section>
  )
}

export default function AdminStaticPagesIndex({
  user_name,
  counts,
  permissions,
  is_admin,
  is_superadmin,
}: AdminDashboardProps) {
  const can = (perm: string) => permissions[perm]
  const payoutAllForm = useForm({})

  function handlePayoutAll() {
    if (!confirm('Are you sure you want to approve all pending reel payouts? This cannot be undone.')) return
    payoutAllForm.post('/admin/reel_payouts/payout_all')
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="space-y-1">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/home">
            <ArrowLeft className="size-4" />
            Leave Admin
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back, {user_name}.</h1>
        <p className="text-sm text-muted-foreground">Pick where to begin — the queue first, the rest second.</p>
      </div>

      {(can('pending_reviews') || can('projects')) && (
        <Section title="Queue">
          {can('pending_reviews') && (
            <Tile href="/admin/ships" label="Ship Reviews" icon={Hammer} />
          )}
          {can('pending_reviews') && (
            <Tile href="/admin/pitches" label="Pitch Reviews" icon={Lightbulb} />
          )}
          {can('pending_reviews') && (
            <Tile
              href="/admin/reviews"
              label="Project Reviews"
              icon={ClipboardCheck}
              badge={counts.pending_reviews || undefined}
            />
          )}
        </Section>
      )}

      {(can('projects') || can('users') || can('support') || can('news') || can('orders') || can('referrals')) && (
        <Section title="Operations">
          {can('projects') && <Tile href="/admin/projects" label="Projects" icon={FolderOpen} badge={counts.projects} />}
          {can('users') && <Tile href="/admin/users" label="Users" icon={Users} badge={counts.users} />}
          {can('support') && <Tile href="/admin/support" label="Support Tickets" icon={LifeBuoy} />}
          {is_admin && <Tile href="/admin/rsvps" label="RSVPs" icon={Sparkles} />}
          {can('news') && <Tile href="/admin/news_posts" label="News Posts" icon={Newspaper} />}
          {can('orders') && (
            <Tile
              href="/admin/orders"
              label="Shop Orders"
              icon={ShoppingCart}
              badge={counts.pending_orders || undefined}
            />
          )}
          {can('orders') && <Tile href="/admin/shop_items" label="Shop Items" icon={Store} />}
          {can('referrals') && <Tile href="/admin/referrals" label="Referrals" icon={Users2} />}
        </Section>
      )}

      {(can('feature_flags') || can('audit_log') || can('jobs') || is_admin || is_superadmin) && (
        <Section title="Engineering">
          {can('feature_flags') && (
            <Tile href="/admin/feature_flags" label="Feature Flags" icon={Flag} badge={counts.feature_flags} />
          )}
          {can('audit_log') && <Tile href="/admin/metrics" label="Metrics" icon={BarChart3} />}
          {can('audit_log') && <Tile href="/admin/audit_log" label="Audit Log" icon={ScrollText} />}
          {is_admin && <Tile href="/admin/database" label="Database" icon={Database} />}
          {can('jobs') && <Tile href="/admin/jobs" label="Background Jobs" icon={Briefcase} external />}
          {is_superadmin && <Tile href="/admin/reel_payouts" label="Reel Payouts" icon={DollarSign} />}
          {is_admin && <Tile href="/admin/reel_ads" label="Reel Ads" icon={PlayCircle} />}
        </Section>
      )}

      {can('third_party') && (
        <Section title="Third party">
          <Tile href="https://sentry.io" label="Sentry" icon={Activity} external />
        </Section>
      )}

      {is_superadmin && (
        <Section title="Superadmin">
          <Tile href="/admin/airtable_queue" label="Airtable Queue" icon={TableProperties} />
          <button
            type="button"
            onClick={handlePayoutAll}
            disabled={payoutAllForm.processing}
            className="w-full text-left"
          >
            <Card className="hover:bg-accent transition-colors cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-md bg-muted p-2 text-foreground inline-flex items-center justify-center">
                    <Coins className="size-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {payoutAllForm.processing ? 'Processing…' : 'Payout All Reels'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </button>
        </Section>
      )}
    </div>
  )
}
