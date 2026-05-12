import { useState } from 'react'
import { Link, router, usePage } from '@inertiajs/react'
import {
  Gavel,
  ShieldCheck,
  AlertTriangle,
  History,
  ToggleLeft,
  ToggleRight,
  CheckCircle2,
  Circle,
  Trash2,
  RotateCcw,
  Award,
  X,
  Lock,
  Unlock,
  ArrowRight,
} from 'lucide-react'
import { Badge } from '@/components/admin/ui/badge'
import { Button } from '@/components/admin/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/admin/ui/card'
import { Input } from '@/components/admin/ui/input'
import { Textarea } from '@/components/admin/ui/textarea'
import { Separator } from '@/components/admin/ui/separator'
import { cn } from '@/components/admin/lib/cn'
import type { AdminUserDetail, UserNote, KudoEntry, HackatimeInfo, SharedProps } from '@/types'

const permissionLabels: Record<string, string> = {
  pending_reviews: 'Pitch Reviews',
  projects: 'Projects',
  users: 'Users',
  ships: 'Build Reviews',
  feature_flags: 'Feature Flags',
  audit_log: 'Audit Log',
  jobs: 'Jobs',
  third_party: '3rd Party',
  support: 'Support Tickets',
  hackatime: 'Hackatime',
  news: 'News',
  orders: 'Orders',
  referrals: 'Referrals',
  superadmin: 'Superadmin',
}

const roleDescriptions: Record<string, string> = {
  user: 'Basic user account',
  admin: 'Full access to everything',
  reviewer: 'Reviews pitches and builds',
  support: 'Manages users and projects',
  fulfillment: 'Handles project fulfillment',
}

interface CoinSummary {
  balance: number
  earned: number
  spent: number
  adjusted: number
}

interface CoinAdjustment {
  id: number
  amount: number
  reason: string
  actor_name: string
  created_at: string
}

interface BadgeEntry {
  id: number
  key: string | null
  name: string
  description: string | null
  icon: string
  color: string
  awarded_at: string
  awarder_name: string | null
}

const BADGE_COLOR_SWATCH: Record<string, string> = {
  orange: 'bg-orange-500/15 text-orange-700 dark:text-orange-300',
  emerald: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  amber: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  red: 'bg-red-500/15 text-red-700 dark:text-red-300',
  purple: 'bg-purple-500/15 text-purple-700 dark:text-purple-300',
  blue: 'bg-blue-500/15 text-blue-700 dark:text-blue-300',
  stone: 'bg-stone-500/15 text-stone-700 dark:text-stone-300',
}

export default function AdminUsersShow({
  user,
  projects,
  notes,
  kudos,
  badges,
  coins,
  coin_adjustments,
  hackatime,
  can,
  available_roles,
  available_permissions,
  available_regions,
  badge_colors,
}: {
  user: AdminUserDetail
  projects: { id: number; name: string; ships_count: number; created_at: string }[]
  notes: UserNote[]
  kudos: KudoEntry[]
  badges: BadgeEntry[]
  coins: CoinSummary
  coin_adjustments: CoinAdjustment[]
  hackatime: HackatimeInfo | null
  can: { destroy: boolean; restore: boolean }
  available_roles: string[]
  available_permissions: string[]
  available_regions: Record<string, string>
  badge_colors: string[]
}) {
  const currentUser = usePage<SharedProps>().props.auth.user
  const isSuperadmin = !!currentUser?.is_superadmin
  const visiblePermissions = available_permissions.filter((p) => p !== 'superadmin' || isSuperadmin)

  const [banReason, setBanReason] = useState('')
  const [showBanForm, setShowBanForm] = useState(false)
  const [noteContent, setNoteContent] = useState('')
  const [kudoContent, setKudoContent] = useState('')
  const [coinAmount, setCoinAmount] = useState('')
  const [coinReason, setCoinReason] = useState('')
  const [badgeName, setBadgeName] = useState('')
  const [badgeDescription, setBadgeDescription] = useState('')
  const [badgeIcon, setBadgeIcon] = useState('military_tech')
  const [badgeColor, setBadgeColor] = useState(badge_colors[0] || 'orange')

  function handleBan() {
    if (!banReason.trim()) return alert('You must provide a reason for banning.')
    router.post(`/admin/users/${user.id}/ban`, { ban_reason: banReason })
  }

  function handleUnban() {
    if (!confirm(`Unban ${user.display_name}?`)) return
    router.post(`/admin/users/${user.id}/unban`)
  }

  function handleDelete() {
    const msg = user.is_discarded
      ? `Permanently destroy ${user.display_name}? This cannot be undone.`
      : `Soft-delete ${user.display_name}?`
    if (!confirm(msg)) return
    router.delete(`/admin/users/${user.id}`)
  }

  function handleRestore() {
    if (!confirm(`Restore ${user.display_name}?`)) return
    router.post(`/admin/users/${user.id}/restore`)
  }

  function toggleRole(role: string) {
    const newRoles = user.roles.includes(role) ? user.roles.filter((r) => r !== role) : [...user.roles, role]
    if (newRoles.length === 0) return alert('User must have at least one role.')
    router.patch(`/admin/users/${user.id}/update_roles`, { roles: newRoles }, { preserveState: true, preserveScroll: true })
  }

  function togglePermission(perm: string) {
    const newPerms = user.permissions.includes(perm)
      ? user.permissions.filter((p) => p !== perm)
      : [...user.permissions, perm]
    router.patch(`/admin/users/${user.id}/update_permissions`, { permissions: newPerms }, { preserveState: true, preserveScroll: true })
  }

  function revokeAllPermissions() {
    if (!confirm('Revoke all permissions?')) return
    router.patch(`/admin/users/${user.id}/update_permissions`, { permissions: [] }, { preserveState: true, preserveScroll: true })
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-center sm:text-left">
        <img src={user.avatar} alt={user.display_name} className="size-20 rounded-full border border-border shrink-0 mx-auto sm:mx-0" />
        <div>
          <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
            <h1 className="text-2xl font-semibold tracking-tight">{user.display_name}</h1>
            {user.is_banned && (
              <Badge variant="destructive">
                <Gavel className="size-3" />
                Banned
              </Badge>
            )}
            {user.is_discarded && <Badge variant="outline">Deleted {user.discarded_at}</Badge>}
          </div>
          <p className="text-sm text-muted-foreground mt-1">{user.email}</p>
        </div>
      </div>

      {user.is_banned && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="size-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-destructive">This user is banned.</p>
              {user.ban_reason && <p className="text-sm mt-1">{user.ban_reason}</p>}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[
          { label: 'Timezone', value: user.timezone },
          { label: 'Joined', value: user.created_at },
          { label: 'Banned', value: user.is_banned ? 'Yes' : 'No' },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="p-4">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">{item.label}</span>
              <p className="mt-1">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {hackatime && (
        <Card>
          <CardHeader>
            <CardTitle>Hackatime</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <span className="text-xs text-muted-foreground uppercase tracking-wide">Trust Level</span>
                <p
                  className={cn(
                    'mt-1 font-semibold capitalize',
                    hackatime.trust_level === 'green' && 'text-emerald-600 dark:text-emerald-400',
                    hackatime.trust_level === 'blue' && 'text-blue-600 dark:text-blue-400',
                    hackatime.trust_level === 'yellow' && 'text-amber-600 dark:text-amber-400',
                    hackatime.trust_level === 'red' && 'text-red-600 dark:text-red-400',
                  )}
                >
                  {hackatime.trust_level || 'Unknown'}
                </p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground uppercase tracking-wide">Coding Time</span>
                <p className="mt-1">
                  {hackatime.total_coding_time ? `${Math.round(hackatime.total_coding_time / 3600)}h` : '-'}
                </p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground uppercase tracking-wide">Days Active</span>
                <p className="mt-1">{hackatime.days_active ?? '-'}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground uppercase tracking-wide">Last Active</span>
                <p className="mt-1">{hackatime.last_heartbeat_at || '-'}</p>
              </div>
            </div>
            {(hackatime.suspected || hackatime.banned) && (
              <div className="mt-3 flex gap-2">
                {hackatime.suspected && <Badge variant="warning">Suspected</Badge>}
                {hackatime.banned && <Badge variant="destructive">Banned on Hackatime</Badge>}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Roles</CardTitle>
        </CardHeader>
        <CardContent>
          {isSuperadmin ? (
            <>
              <p className="text-sm text-muted-foreground mb-3">
                Assigning a staff role auto-grants its default permissions. You can still adjust them below.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {available_roles.map((role) => {
                  const active = user.roles.includes(role)
                  return (
                    <button
                      key={role}
                      onClick={() => toggleRole(role)}
                      className={cn(
                        'px-3 py-2.5 text-left rounded-md border transition-colors cursor-pointer flex items-center gap-3',
                        active
                          ? 'border-primary bg-primary/10'
                          : 'border-border bg-background hover:bg-accent',
                      )}
                    >
                      {active ? <CheckCircle2 className="size-4 text-primary" /> : <Circle className="size-4 text-muted-foreground" />}
                      <div>
                        <span className="text-sm font-medium capitalize">{role}</span>
                        {roleDescriptions[role] && (
                          <p className="text-xs text-muted-foreground">{roleDescriptions[role]}</p>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-3">Only superadmins can change roles.</p>
              <div className="flex flex-wrap gap-2">
                {user.roles.length === 0 ? (
                  <span className="text-xs text-muted-foreground">No roles</span>
                ) : (
                  user.roles.map((role) => (
                    <Badge key={role} variant="outline">
                      {role}
                    </Badge>
                  ))
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Permissions</CardTitle>
          {isSuperadmin && user.permissions.length > 0 && (
            <Button variant="destructive" size="sm" onClick={revokeAllPermissions}>
              Revoke All
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {isSuperadmin ? (
            <>
              <p className="text-sm text-muted-foreground mb-3">
                Toggle individual permissions. Assigning a role auto-grants its defaults.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {visiblePermissions.map((perm) => {
                  const active = user.permissions.includes(perm)
                  return (
                    <button
                      key={perm}
                      onClick={() => togglePermission(perm)}
                      className={cn(
                        'px-3 py-2 text-left rounded-md border transition-colors cursor-pointer flex items-center gap-2 text-sm',
                        active ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-border bg-background hover:bg-accent',
                      )}
                    >
                      {active ? <ToggleRight className="size-4 text-emerald-600 dark:text-emerald-400" /> : <ToggleLeft className="size-4 text-muted-foreground" />}
                      {permissionLabels[perm] || perm}
                    </button>
                  )
                })}
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-3">Only superadmins can change permissions.</p>
              <div className="flex flex-wrap gap-2">
                {user.permissions.length === 0 ? (
                  <span className="text-xs text-muted-foreground">No permissions</span>
                ) : (
                  user.permissions.map((perm) => (
                    <Badge key={perm} variant="outline">
                      {permissionLabels[perm] || perm}
                    </Badge>
                  ))
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Steel Coins</CardTitle>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/admin/users/${user.id}/coin_history`}>
              <History className="size-4" />
              View History
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Adjust this user's coin balance. Positive grants, negative removes.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-md border border-border bg-card p-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Balance</p>
              <p className="text-xl font-semibold mt-1">{coins.balance}c</p>
            </div>
            <div className="rounded-md border border-border bg-card p-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Earned</p>
              <p className="text-xl font-semibold mt-1">{coins.earned}c</p>
            </div>
            <div className="rounded-md border border-border bg-card p-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Spent</p>
              <p className="text-xl font-semibold mt-1">{coins.spent}c</p>
            </div>
            <div className="rounded-md border border-border bg-card p-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Adjusted</p>
              <p className="text-xl font-semibold mt-1">{coins.adjusted}c</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <Input
              type="number"
              step="0.01"
              value={coinAmount}
              onChange={(e) => setCoinAmount(e.target.value)}
              placeholder="Amount (+ or -)"
            />
            <Input
              type="text"
              value={coinReason}
              onChange={(e) => setCoinReason(e.target.value)}
              placeholder="Reason"
              className="md:col-span-2"
            />
          </div>
          <Button
            onClick={() => {
              const amt = parseFloat(coinAmount)
              if (!amt || !coinReason.trim()) return
              router.post(
                `/admin/users/${user.id}/adjust_coins`,
                { amount: amt, reason: coinReason },
                {
                  onSuccess: () => {
                    setCoinAmount('')
                    setCoinReason('')
                  },
                },
              )
            }}
            disabled={!coinAmount || !coinReason.trim()}
            size="sm"
          >
            Apply Adjustment
          </Button>

          <Separator />

          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Shop access</p>
              <p className="text-xs text-muted-foreground">Override the "must have a built project" gate.</p>
            </div>
            <button
              onClick={() => router.post(`/admin/users/${user.id}/toggle_shop_unlocked`)}
              className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer shrink-0',
                user.shop_unlocked ? 'bg-primary' : 'bg-muted',
              )}
            >
              <span
                className={cn(
                  'inline-block h-4 w-4 transform rounded-full bg-background transition-transform shadow',
                  user.shop_unlocked ? 'translate-x-6' : 'translate-x-1',
                )}
              />
            </button>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Maintenance bypass</p>
              <p className="text-xs text-muted-foreground">Allow this user during maintenance mode.</p>
            </div>
            <button
              onClick={() => router.post(`/admin/users/${user.id}/toggle_maintenance_bypass`)}
              className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer shrink-0',
                user.maintenance_bypass ? 'bg-primary' : 'bg-muted',
              )}
            >
              <span
                className={cn(
                  'inline-block h-4 w-4 transform rounded-full bg-background transition-transform shadow',
                  user.maintenance_bypass ? 'translate-x-6' : 'translate-x-1',
                )}
              />
            </button>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium">Referral code</p>
              {user.referral_code ? (
                <p className="text-xs text-muted-foreground">
                  Current code: <span className="font-mono text-foreground">{user.referral_code}</span>
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">No code set yet.</p>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const msg = user.referral_code
                  ? `Regenerate ${user.display_name}'s referral code?`
                  : `Generate a referral code for ${user.display_name}?`
                if (!confirm(msg)) return
                router.post(`/admin/users/${user.id}/generate_referral_code`)
              }}
            >
              {user.referral_code ? 'Regenerate' : 'Generate'}
            </Button>
          </div>

          {user.roles.includes('fulfillment') && (
            <>
              <Separator />
              <div>
                <p className="text-sm font-medium mb-1">Fulfillment Regions</p>
                <p className="text-xs text-muted-foreground mb-3">
                  Regions this fulfillment team member handles. Orders auto-assign based on this.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(available_regions).map(([key, label]) => {
                    const active = user.fulfillment_regions.includes(key)
                    return (
                      <button
                        key={key}
                        onClick={() => {
                          const next = active
                            ? user.fulfillment_regions.filter((r) => r !== key)
                            : [...user.fulfillment_regions, key]
                          router.patch(`/admin/users/${user.id}/update_fulfillment_regions`, { fulfillment_regions: next })
                        }}
                        className={cn(
                          'px-3 py-2 text-xs font-medium rounded-md border transition-colors cursor-pointer',
                          active
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground',
                        )}
                      >
                        {label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </>
          )}

          {coin_adjustments.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                {coin_adjustments.map((adj) => (
                  <Card key={adj.id}>
                    <CardContent className="p-3 flex items-center justify-between gap-4 flex-wrap">
                      <div className="min-w-0">
                        <p className="text-sm break-words">{adj.reason}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          by {adj.actor_name} · {adj.created_at}
                        </p>
                      </div>
                      <span
                        className={cn(
                          'text-lg font-semibold shrink-0',
                          adj.amount >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400',
                        )}
                      >
                        {adj.amount >= 0 ? '+' : ''}
                        {adj.amount}c
                      </span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Internal Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">Only visible to staff.</p>
          <Textarea value={noteContent} onChange={(e) => setNoteContent(e.target.value)} placeholder="Add a note..." rows={3} />
          <Button
            size="sm"
            onClick={() => {
              if (!noteContent.trim()) return
              router.post(`/admin/users/${user.id}/add_note`, { content: noteContent })
              setNoteContent('')
            }}
            disabled={!noteContent.trim()}
          >
            Add Note
          </Button>
          {notes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No notes yet.</p>
          ) : (
            <div className="space-y-2">
              {notes.map((note) => (
                <Card key={note.id}>
                  <CardContent className="p-3 flex gap-2">
                    <img src={note.author_avatar} alt={note.author_name} className="size-6 rounded-full shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{note.author_name}</span>
                        <span className="text-xs text-muted-foreground">{note.created_at}</span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap mt-1">{note.content}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm('Delete this note?')) router.delete(`/admin/users/${user.id}/notes/${note.id}`)
                      }}
                    >
                      <X className="size-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Kudos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">Public shoutouts shown on the user's profile.</p>
          <Textarea value={kudoContent} onChange={(e) => setKudoContent(e.target.value)} placeholder="Give them some kudos..." rows={3} />
          <Button
            size="sm"
            onClick={() => {
              if (!kudoContent.trim()) return
              router.post(`/admin/users/${user.id}/add_kudo`, { content: kudoContent })
              setKudoContent('')
            }}
            disabled={!kudoContent.trim()}
          >
            Add Kudos
          </Button>
          {kudos.length === 0 ? (
            <p className="text-sm text-muted-foreground">No kudos yet.</p>
          ) : (
            <div className="space-y-2">
              {kudos.map((kudo) => (
                <Card key={kudo.id}>
                  <CardContent className="p-3 flex gap-2">
                    <img src={kudo.author_avatar} alt={kudo.author_name} className="size-6 rounded-full shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{kudo.author_name}</span>
                        <span className="text-xs text-muted-foreground">{kudo.created_at}</span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap mt-1 break-words">{kudo.content}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm('Delete this kudos?')) router.delete(`/admin/users/${user.id}/kudos/${kudo.id}`)
                      }}
                    >
                      <X className="size-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="size-4" />
            Badges
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Award custom badges shown on the public profile. Auto-earned badges appear here too.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <Input value={badgeName} onChange={(e) => setBadgeName(e.target.value)} placeholder="Badge name" />
            <Input
              value={badgeIcon}
              onChange={(e) => setBadgeIcon(e.target.value)}
              placeholder="Icon (material symbol name)"
              className="font-mono"
            />
          </div>
          <Textarea
            value={badgeDescription}
            onChange={(e) => setBadgeDescription(e.target.value)}
            placeholder="Description (optional)"
            rows={2}
          />
          <div className="flex flex-wrap gap-2">
            {badge_colors.map((color) => {
              const active = badgeColor === color
              return (
                <button
                  key={color}
                  onClick={() => setBadgeColor(color)}
                  className={cn(
                    'px-3 py-1.5 text-xs font-medium uppercase tracking-wide rounded-md cursor-pointer flex items-center gap-1.5 transition-all',
                    BADGE_COLOR_SWATCH[color] || BADGE_COLOR_SWATCH.orange,
                    active ? 'ring-2 ring-ring' : 'opacity-60 hover:opacity-100',
                  )}
                >
                  <span className="material-symbols-outlined text-sm">{badgeIcon || 'military_tech'}</span>
                  {color}
                </button>
              )
            })}
          </div>
          <Button
            size="sm"
            onClick={() => {
              if (!badgeName.trim()) return
              router.post(
                `/admin/users/${user.id}/add_badge`,
                {
                  name: badgeName.trim(),
                  description: badgeDescription.trim(),
                  icon: badgeIcon.trim() || 'military_tech',
                  color: badgeColor,
                },
                {
                  onSuccess: () => {
                    setBadgeName('')
                    setBadgeDescription('')
                    setBadgeIcon('military_tech')
                    setBadgeColor(badge_colors[0] || 'orange')
                  },
                },
              )
            }}
            disabled={!badgeName.trim()}
          >
            Award Badge
          </Button>

          {badges.length === 0 ? (
            <p className="text-sm text-muted-foreground">No badges yet.</p>
          ) : (
            <div className="space-y-2">
              {badges.map((badge) => (
                <Card key={badge.id}>
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className={cn('shrink-0 size-10 rounded-md flex items-center justify-center', BADGE_COLOR_SWATCH[badge.color] || BADGE_COLOR_SWATCH.orange)}>
                      <span className="material-symbols-outlined text-2xl">{badge.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">{badge.name}</span>
                        {badge.key && <Badge variant="outline">Auto</Badge>}
                      </div>
                      {badge.description && <p className="text-xs text-muted-foreground mt-0.5 break-words">{badge.description}</p>}
                      <p className="text-[11px] text-muted-foreground mt-0.5 uppercase tracking-wide">
                        {badge.awarded_at}
                        {badge.awarder_name ? ` · awarded by ${badge.awarder_name}` : ' · auto-awarded'}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm(`Remove the "${badge.name}" badge?`)) router.delete(`/admin/users/${user.id}/badges/${badge.id}`)
                      }}
                    >
                      <X className="size-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {can.destroy && (
        <Card>
          <CardHeader>
            <CardTitle>Ban Status</CardTitle>
          </CardHeader>
          <CardContent>
            {user.is_banned ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-destructive">
                  <Gavel className="size-4" />
                  <span className="font-semibold">Banned</span>
                </div>
                {user.ban_reason && (
                  <div className="rounded-md border border-border bg-muted/40 p-3">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Reason</p>
                    <p className="text-sm">{user.ban_reason}</p>
                  </div>
                )}
                <Button onClick={handleUnban}>
                  <Unlock className="size-4" />
                  Unban User
                </Button>
              </div>
            ) : (
              <>
                {!showBanForm ? (
                  <Button variant="destructive" onClick={() => setShowBanForm(true)}>
                    <Gavel className="size-4" />
                    Ban User
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Reason for ban</label>
                      <Textarea
                        value={banReason}
                        onChange={(e) => setBanReason(e.target.value)}
                        placeholder="Why is this user being banned?"
                        rows={3}
                        required
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button variant="destructive" onClick={handleBan}>
                        <Lock className="size-4" />
                        Confirm Ban
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowBanForm(false)
                          setBanReason('')
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Projects ({projects.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <p className="text-sm text-muted-foreground">No projects yet.</p>
          ) : (
            <div className="space-y-2">
              {projects.map((project) => (
                <Link key={project.id} href={`/admin/projects/${project.id}`} className="block group">
                  <Card className="group-hover:bg-accent transition-colors">
                    <CardContent className="p-3 flex items-center justify-between">
                      <span className="font-medium truncate">{project.name}</span>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                        <span>{project.ships_count} ships</span>
                        <span>{project.created_at}</span>
                        <ArrowRight className="size-3" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {can.restore && (
        <Card className="border-emerald-500/40">
          <CardHeader>
            <CardTitle className="text-emerald-600 dark:text-emerald-400">Restore</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              This user is soft-deleted. Restore them to make their account active again.
            </p>
            <Button onClick={handleRestore}>
              <RotateCcw className="size-4" />
              Restore User
            </Button>
          </CardContent>
        </Card>
      )}

      {can.destroy && (
        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <ShieldCheck className="size-4" />
              Danger Zone
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {user.is_discarded ? 'Permanently destroy this user.' : 'Soft-delete this user.'}
            </p>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="size-4" />
              {user.is_discarded ? 'Permanently Destroy' : 'Delete User'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
