import { router, Link } from '@inertiajs/react'
import {
  CheckCircle2,
  Undo2,
  XCircle,
  Trash2,
  Trash,
  RotateCcw,
  PlusCircle,
  Pencil,
  ToggleRight,
  Gavel,
  ShieldCheck,
  KeyRound,
  BadgeCheck,
  StickyNote,
  Heart,
  HeartCrack,
  LogIn,
  LogOut,
  Database,
  Download,
  Reply,
  Hand,
  CheckCheck,
  Eye,
  Star,
  Megaphone,
  FileEdit,
  RefreshCw,
  Info,
  ArrowRight,
  type LucideIcon,
} from 'lucide-react'
import { Card, CardContent } from '@/components/admin/ui/card'
import { Button } from '@/components/admin/ui/button'
import AdminPagination from '@/components/admin/AdminPagination'
import type { PagyProps } from '@/types'

interface AuditEntry {
  id: number
  action: string
  description: string
  actor_id: number | null
  actor_name: string
  target_type: string | null
  target_id: number | null
  target_label: string | null
  target_url: string | null
  created_at: string
}

const ACTION_ICONS: Record<string, { icon: LucideIcon; color: string }> = {
  approved: { icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400' },
  returned: { icon: Undo2, color: 'text-amber-600 dark:text-amber-400' },
  rejected: { icon: XCircle, color: 'text-red-600 dark:text-red-400' },
  destroyed: { icon: Trash2, color: 'text-red-600 dark:text-red-400' },
  soft_deleted: { icon: Trash, color: 'text-red-600 dark:text-red-400' },
  restored: { icon: RotateCcw, color: 'text-emerald-600 dark:text-emerald-400' },
  created: { icon: PlusCircle, color: 'text-emerald-600 dark:text-emerald-400' },
  updated: { icon: Pencil, color: 'text-amber-600 dark:text-amber-400' },
  toggled: { icon: ToggleRight, color: 'text-amber-600 dark:text-amber-400' },
  banned: { icon: Gavel, color: 'text-red-600 dark:text-red-400' },
  unbanned: { icon: ShieldCheck, color: 'text-emerald-600 dark:text-emerald-400' },
  permissions_updated: { icon: KeyRound, color: 'text-amber-600 dark:text-amber-400' },
  roles_updated: { icon: BadgeCheck, color: 'text-amber-600 dark:text-amber-400' },
  beta_approval_toggled: { icon: ShieldCheck, color: 'text-amber-600 dark:text-amber-400' },
  note_added: { icon: StickyNote, color: 'text-muted-foreground' },
  note_destroyed: { icon: StickyNote, color: 'text-red-600 dark:text-red-400' },
  kudo_added: { icon: Heart, color: 'text-pink-600 dark:text-pink-400' },
  kudo_destroyed: { icon: HeartCrack, color: 'text-red-600 dark:text-red-400' },
  signed_in: { icon: LogIn, color: 'text-muted-foreground' },
  signed_out: { icon: LogOut, color: 'text-muted-foreground' },
  queried: { icon: Database, color: 'text-amber-600 dark:text-amber-400' },
  exported: { icon: Download, color: 'text-muted-foreground' },
  replied: { icon: Reply, color: 'text-muted-foreground' },
  claimed: { icon: Hand, color: 'text-amber-600 dark:text-amber-400' },
  resolved: { icon: CheckCheck, color: 'text-emerald-600 dark:text-emerald-400' },
  visibility_toggled: { icon: Eye, color: 'text-amber-600 dark:text-amber-400' },
  staff_pick_toggled: { icon: Star, color: 'text-amber-600 dark:text-amber-400' },
  publish_toggled: { icon: Megaphone, color: 'text-amber-600 dark:text-amber-400' },
  reverted_to_draft: { icon: FileEdit, color: 'text-amber-600 dark:text-amber-400' },
  pitch_approved: { icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400' },
  review_notes_saved: { icon: FileEdit, color: 'text-amber-600 dark:text-amber-400' },
  readme_refreshed: { icon: RefreshCw, color: 'text-muted-foreground' },
}

function iconFor(action: string) {
  const verb = action.split('.').pop() || ''
  return ACTION_ICONS[verb] || { icon: Info, color: 'text-muted-foreground' }
}

export default function AdminAuditLogIndex({
  entries,
  pagy,
  filters,
  actions,
  target_types,
}: {
  entries: AuditEntry[]
  pagy: PagyProps
  filters: { action: string; target_type: string; actor_id: string }
  actions: string[]
  target_types: string[]
}) {
  function applyFilter(key: string, value: string) {
    const params = { ...filters, [key]: value }
    router.get(
      '/admin/audit_log',
      { action_filter: params.action, target_type: params.target_type, actor_id: params.actor_id },
      { preserveState: true },
    )
  }

  const selectCls =
    'h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground cursor-pointer'

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Audit Log</h1>

      <div className="flex flex-wrap gap-3 items-end">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Action</label>
          <select value={filters.action} onChange={(e) => applyFilter('action', e.target.value)} className={selectCls}>
            <option value="">All actions</option>
            {actions.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Target Type</label>
          <select
            value={filters.target_type}
            onChange={(e) => applyFilter('target_type', e.target.value)}
            className={selectCls}
          >
            <option value="">All targets</option>
            {target_types.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        {(filters.action || filters.target_type || filters.actor_id) && (
          <Button variant="outline" size="sm" onClick={() => router.get('/admin/audit_log')}>
            Clear
          </Button>
        )}
      </div>

      {entries.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-base font-medium mb-1">No audit entries</p>
            <p className="text-sm text-muted-foreground">Nothing has been logged yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => {
            const ic = iconFor(entry.action)
            const Icon = ic.icon
            return (
              <Link key={entry.id} href={`/admin/audit_log/${entry.id}`} className="block group">
                <Card className="group-hover:bg-accent transition-colors">
                  <CardContent className="p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon className={`size-4 shrink-0 ${ic.color}`} />
                      <div className="min-w-0">
                        <p className="text-sm truncate">{entry.description}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          by <span className="text-foreground">{entry.actor_name}</span>
                          <span className="mx-2">·</span>
                          <span className="font-mono">{entry.action}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-muted-foreground">{entry.created_at}</span>
                      <ArrowRight className="size-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
          {pagy && pagy.pages > 1 && <AdminPagination pagy={pagy} />}
        </div>
      )}
    </div>
  )
}
