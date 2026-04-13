import { useState } from 'react'
import { Link, router, usePage } from '@inertiajs/react'
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

export default function AdminUsersShow({
  user,
  projects,
  notes,
  kudos,
  coins,
  coin_adjustments,
  hackatime,
  can,
  available_roles,
  available_permissions,
  available_regions,
}: {
  user: AdminUserDetail
  projects: { id: number; name: string; ships_count: number; created_at: string }[]
  notes: UserNote[]
  kudos: KudoEntry[]
  coins: CoinSummary
  coin_adjustments: CoinAdjustment[]
  hackatime: HackatimeInfo | null
  can: { destroy: boolean; restore: boolean }
  available_roles: string[]
  available_permissions: string[]
  available_regions: Record<string, string>
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

  function handleBan() {
    if (!banReason.trim()) {
      alert('You must provide a reason for banning.')
      return
    }
    router.post(`/admin/users/${user.id}/ban`, { ban_reason: banReason })
  }

  function handleUnban() {
    if (!confirm(`Unban ${user.display_name}?`)) return
    router.post(`/admin/users/${user.id}/unban`)
  }

  function handleDelete() {
    const msg = user.is_discarded
      ? `Are you sure you want to PERMANENTLY destroy ${user.display_name}? This cannot be undone.`
      : `Are you sure you want to delete ${user.display_name}? This will soft-delete the user.`
    if (!confirm(msg)) return
    router.delete(`/admin/users/${user.id}`)
  }

  function handleRestore() {
    if (!confirm(`Restore ${user.display_name}?`)) return
    router.post(`/admin/users/${user.id}/restore`)
  }

  function toggleRole(role: string) {
    const newRoles = user.roles.includes(role)
      ? user.roles.filter((r) => r !== role)
      : [...user.roles, role]
    if (newRoles.length === 0) {
      alert('User must have at least one role.')
      return
    }
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
    <div className="p-5 md:p-12 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center gap-5 mb-4 text-center sm:text-left">
        <img src={user.avatar} alt={user.display_name} className="w-24 h-24 border border-white/10 shrink-0 mx-auto sm:mx-0" />
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-headline font-bold text-[#e5e2e1] tracking-tight">
              {user.display_name}
            </h1>
            {user.is_banned && (
              <span className="bg-red-500/20 text-red-400 px-3 py-1 text-[10px] uppercase font-bold tracking-widest flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">gavel</span>
                Banned
              </span>
            )}
            {user.is_discarded && (
              <span className="bg-red-500/10 text-red-400 px-3 py-1 text-[10px] uppercase font-bold tracking-widest">
                Deleted {user.discarded_at}
              </span>
            )}
          </div>
          <p className="text-stone-500 text-sm">{user.email}</p>
        </div>
      </div>

      {user.is_banned && (
        <div className="border border-red-500/20 bg-red-500/5 p-5 mb-10 flex items-start gap-3">
          <span className="material-symbols-outlined text-red-400 text-xl shrink-0 mt-0.5">warning</span>
          <div>
            <p className="text-red-400 text-sm font-bold mb-1">This user is banned. Be wary.</p>
            {user.ban_reason && <p className="text-stone-400 text-sm">{user.ban_reason}</p>}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mb-6">
        {[
          { label: 'Timezone', value: user.timezone },
          { label: 'Joined', value: user.created_at },
          { label: 'Banned', value: user.is_banned ? 'Yes' : 'No' },
        ].map((item) => (
          <div key={item.label} className="bg-[#1c1b1b] ghost-border p-4">
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-600">{item.label}</span>
            <p className="text-[#e5e2e1] mt-1">{item.value}</p>
          </div>
        ))}
      </div>

      {hackatime && (
        <div className="bg-[#1c1b1b] ghost-border p-6 mb-6">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-stone-500 font-headline mb-4">Hackatime</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-600">Trust Level</span>
              <p className={`mt-1 font-bold ${
                hackatime.trust_level === 'green' ? 'text-emerald-400' :
                hackatime.trust_level === 'blue' ? 'text-blue-400' :
                hackatime.trust_level === 'yellow' ? 'text-amber-400' :
                hackatime.trust_level === 'red' ? 'text-red-400' : 'text-stone-400'
              }`}>
                {hackatime.trust_level || 'Unknown'}
              </p>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-600">Coding Time</span>
              <p className="text-[#e5e2e1] mt-1">{hackatime.total_coding_time ? `${Math.round(hackatime.total_coding_time / 3600)}h` : '—'}</p>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-600">Days Active</span>
              <p className="text-[#e5e2e1] mt-1">{hackatime.days_active ?? '—'}</p>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-600">Last Active</span>
              <p className="text-[#e5e2e1] mt-1">{hackatime.last_heartbeat_at || '—'}</p>
            </div>
          </div>
          {(hackatime.suspected || hackatime.banned) && (
            <div className="mt-4 flex gap-2">
              {hackatime.suspected && (
                <span className="bg-amber-500/10 text-amber-400 px-3 py-1 text-[10px] uppercase font-bold tracking-widest">Suspected</span>
              )}
              {hackatime.banned && (
                <span className="bg-red-500/10 text-red-400 px-3 py-1 text-[10px] uppercase font-bold tracking-widest">Banned on Hackatime</span>
              )}
            </div>
          )}
        </div>
      )}

      <div className="mb-10">
        <h2 className="text-xl font-headline font-bold text-[#e5e2e1] tracking-tight mb-4">Roles</h2>
        {isSuperadmin ? (
          <>
            <p className="text-stone-500 text-sm mb-4">Assigning a staff role auto-grants its default permissions. You can still manually adjust permissions below.</p>
            <div className="grid grid-cols-2 gap-2">
              {available_roles.map((role) => {
                const active = user.roles.includes(role)
                return (
                  <button
                    key={role}
                    onClick={() => toggleRole(role)}
                    className={`px-4 py-3 text-left transition-colors cursor-pointer flex items-center gap-3 ${
                      active
                        ? 'signature-smolder text-[#4c1a00]'
                        : 'ghost-border bg-[#1c1b1b] text-stone-500 hover:text-stone-300 hover:bg-[#2a2a2a]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">
                      {active ? 'check_circle' : 'radio_button_unchecked'}
                    </span>
                    <div>
                      <span className="text-xs font-bold uppercase tracking-[0.15em]">{role}</span>
                      {roleDescriptions[role] && (
                        <p className={`text-[10px] mt-0.5 ${active ? 'text-[#4c1a00]/70' : 'text-stone-600'}`}>{roleDescriptions[role]}</p>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </>
        ) : (
          <>
            <p className="text-stone-500 text-sm mb-4">Only superadmins can change roles.</p>
            <div className="flex flex-wrap gap-2">
              {user.roles.length === 0 ? (
                <span className="text-stone-600 text-xs">No roles</span>
              ) : (
                user.roles.map((role) => (
                  <span key={role} className="px-3 py-1.5 ghost-border bg-[#1c1b1b] text-stone-300 text-[10px] font-bold uppercase tracking-[0.15em]">
                    {role}
                  </span>
                ))
              )}
            </div>
          </>
        )}
      </div>

      <div className="mb-10">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-headline font-bold text-[#e5e2e1] tracking-tight">Permissions</h2>
          {isSuperadmin && user.permissions.length > 0 && (
            <button
              onClick={revokeAllPermissions}
              className="bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] transition-colors cursor-pointer"
            >
              Revoke All
            </button>
          )}
        </div>
        {isSuperadmin ? (
          <>
            <p className="text-stone-500 text-sm mb-4">Toggle individual permissions. Assigning a role auto-grants its defaults, but you can override them.</p>
            <div className="grid grid-cols-2 gap-2">
              {visiblePermissions.map((perm) => {
                const active = user.permissions.includes(perm)
                const isSuper = perm === 'superadmin'
                return (
                  <button
                    key={perm}
                    onClick={() => togglePermission(perm)}
                    className={`px-4 py-3 text-left text-sm font-medium transition-colors cursor-pointer flex items-center gap-3 ${
                      active
                        ? isSuper
                          ? 'bg-[#ee671c]/15 text-[#ffb595] ghost-border'
                          : 'bg-emerald-500/10 text-emerald-400 ghost-border'
                        : 'bg-[#1c1b1b] text-stone-500 ghost-border hover:bg-[#2a2a2a] hover:text-stone-300'
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg">
                      {active ? 'toggle_on' : 'toggle_off'}
                    </span>
                    {permissionLabels[perm] || perm}
                  </button>
                )
              })}
            </div>
          </>
        ) : (
          <>
            <p className="text-stone-500 text-sm mb-4">Only superadmins can change permissions.</p>
            <div className="flex flex-wrap gap-2">
              {user.permissions.length === 0 ? (
                <span className="text-stone-600 text-xs">No permissions</span>
              ) : (
                user.permissions.map((perm) => (
                  <span key={perm} className="px-3 py-1.5 ghost-border bg-[#1c1b1b] text-stone-300 text-[10px] font-bold uppercase tracking-[0.15em]">
                    {permissionLabels[perm] || perm}
                  </span>
                ))
              )}
            </div>
          </>
        )}
      </div>

      <div className="mb-10">
        <div className="flex items-center justify-between mb-2 gap-3 flex-wrap">
          <h2 className="text-xl font-headline font-bold text-[#e5e2e1] tracking-tight">Steel Coins</h2>
          <Link
            href={`/admin/users/${user.id}/coin_history`}
            className="ghost-border bg-[#1c1b1b] text-stone-400 hover:text-[#e5e2e1] hover:bg-[#2a2a2a] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.15em] transition-colors flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-sm">history</span>
            View History
          </Link>
        </div>
        <p className="text-stone-500 text-sm mb-4">Manually adjust this user's coin balance. Use a positive number to grant, negative to remove.</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <div className="bg-[#1c1b1b] ghost-border p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500 mb-1">Balance</p>
            <p className="text-2xl font-headline font-bold text-[#ee671c]">{coins.balance}c</p>
          </div>
          <div className="bg-[#1c1b1b] ghost-border p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500 mb-1">Earned</p>
            <p className="text-2xl font-headline font-bold text-[#e5e2e1]">{coins.earned}c</p>
          </div>
          <div className="bg-[#1c1b1b] ghost-border p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500 mb-1">Spent</p>
            <p className="text-2xl font-headline font-bold text-[#e5e2e1]">{coins.spent}c</p>
          </div>
          <div className="bg-[#1c1b1b] ghost-border p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500 mb-1">Adjusted</p>
            <p className="text-2xl font-headline font-bold text-[#e5e2e1]">{coins.adjusted}c</p>
          </div>
        </div>

        <div className="bg-[#1c1b1b] ghost-border p-5 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="number"
              step="0.01"
              value={coinAmount}
              onChange={(e) => setCoinAmount(e.target.value)}
              placeholder="Amount (+ or -)"
              className="bg-[#0e0e0e] border-none px-4 py-3 text-sm text-[#e5e2e1] focus:ring-1 focus:ring-[#ee671c]/30 placeholder:text-stone-600"
            />
            <input
              type="text"
              value={coinReason}
              onChange={(e) => setCoinReason(e.target.value)}
              placeholder="Reason"
              className="md:col-span-2 bg-[#0e0e0e] border-none px-4 py-3 text-sm text-[#e5e2e1] focus:ring-1 focus:ring-[#ee671c]/30 placeholder:text-stone-600"
            />
          </div>
          <button
            onClick={() => {
              const amt = parseFloat(coinAmount)
              if (!amt || !coinReason.trim()) return
              router.post(`/admin/users/${user.id}/adjust_coins`, { amount: amt, reason: coinReason }, {
                onSuccess: () => { setCoinAmount(''); setCoinReason('') },
              })
            }}
            disabled={!coinAmount || !coinReason.trim()}
            className="signature-smolder text-[#4c1a00] px-5 py-2 mt-3 text-xs font-bold uppercase tracking-[0.15em] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Apply Adjustment
          </button>
        </div>

        <div className="bg-[#1c1b1b] ghost-border p-5 mb-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-[#e5e2e1] text-sm font-headline font-bold">Shop access</p>
            <p className="text-stone-500 text-xs">Override the "must have a built project" gate. Enable to let this user buy shop items right away.</p>
          </div>
          <button
            onClick={() => router.post(`/admin/users/${user.id}/toggle_shop_unlocked`)}
            className={`relative inline-flex h-6 w-11 items-center transition-colors cursor-pointer shrink-0 ${user.shop_unlocked ? 'bg-[#ee671c]' : 'bg-stone-700'}`}
          >
            <span className={`inline-block h-4 w-4 transform bg-white transition-transform ${user.shop_unlocked ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

        <div className="bg-[#1c1b1b] ghost-border p-5 mb-4 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[#e5e2e1] text-sm font-headline font-bold">Referral code</p>
            {user.referral_code ? (
              <p className="text-stone-500 text-xs mt-1">Current code: <span className="font-mono text-[#ffb595]">{user.referral_code}</span></p>
            ) : (
              <p className="text-stone-500 text-xs mt-1">No code set yet.</p>
            )}
          </div>
          <button
            onClick={() => {
              const msg = user.referral_code
                ? `Regenerate ${user.display_name}'s referral code? The old one will stop working.`
                : `Generate a referral code for ${user.display_name}?`
              if (!confirm(msg)) return
              router.post(`/admin/users/${user.id}/generate_referral_code`)
            }}
            className="ghost-border bg-[#1c1b1b] hover:bg-[#2a2a2a] text-stone-400 hover:text-[#e5e2e1] px-4 py-2 text-xs font-bold uppercase tracking-wider cursor-pointer shrink-0"
          >
            {user.referral_code ? 'Regenerate' : 'Generate'}
          </button>
        </div>

        {user.roles.includes('fulfillment') && (
          <div className="bg-[#1c1b1b] ghost-border p-5 mb-4">
            <p className="text-[#e5e2e1] text-sm font-headline font-bold mb-2">Fulfillment Regions</p>
            <p className="text-stone-500 text-xs mb-3">Regions this fulfillment team member handles. Orders from matching regions auto-assign to them.</p>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(available_regions).map(([key, label]) => {
                const active = user.fulfillment_regions.includes(key)
                return (
                  <button
                    key={key}
                    onClick={() => {
                      const newRegions = active
                        ? user.fulfillment_regions.filter((r) => r !== key)
                        : [...user.fulfillment_regions, key]
                      router.patch(`/admin/users/${user.id}/update_fulfillment_regions`, { fulfillment_regions: newRegions })
                    }}
                    className={`px-3 py-2 text-xs font-bold uppercase tracking-[0.15em] transition-colors cursor-pointer ${
                      active
                        ? 'signature-smolder text-[#4c1a00]'
                        : 'ghost-border bg-[#0e0e0e] text-stone-500 hover:text-stone-300 hover:bg-[#2a2a2a]'
                    }`}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {coin_adjustments.length > 0 && (
          <div className="space-y-2">
            {coin_adjustments.map((adj) => (
              <div key={adj.id} className="bg-[#1c1b1b] ghost-border px-5 py-3 flex items-center justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                  <p className="text-stone-300 text-sm break-words">{adj.reason}</p>
                  <p className="text-stone-600 text-xs mt-0.5">by {adj.actor_name} · {adj.created_at}</p>
                </div>
                <span className={`text-lg font-headline font-bold shrink-0 ${adj.amount >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {adj.amount >= 0 ? '+' : ''}{adj.amount}c
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mb-10">
        <h2 className="text-xl font-headline font-bold text-[#e5e2e1] tracking-tight mb-2">Internal Notes</h2>
        <p className="text-stone-500 text-sm mb-4">Only visible to staff.</p>

        <div className="mb-4">
          <textarea
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            placeholder="Add a note..."
            rows={3}
            className="w-full bg-[#0e0e0e] border-none px-4 py-3 text-sm text-[#e5e2e1] focus:ring-1 focus:ring-[#ee671c]/30 placeholder:text-stone-600 resize-y mb-2"
          />
          <button
            onClick={() => {
              if (!noteContent.trim()) return
              router.post(`/admin/users/${user.id}/add_note`, { content: noteContent })
              setNoteContent('')
            }}
            disabled={!noteContent.trim()}
            className="signature-smolder text-[#4c1a00] px-5 py-2 text-xs font-bold uppercase tracking-[0.15em] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add Note
          </button>
        </div>

        {notes.length > 0 ? (
          <div className="space-y-2">
            {notes.map((note) => (
              <div key={note.id} className="bg-[#1c1b1b] ghost-border px-5 py-4 flex gap-3">
                <img src={note.author_avatar} alt={note.author_name} className="w-8 h-8 border border-white/10 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-headline font-bold text-[#e5e2e1] text-sm">{note.author_name}</span>
                    <span className="text-stone-600 text-xs">{note.created_at}</span>
                  </div>
                  <p className="text-stone-300 text-sm whitespace-pre-wrap">{note.content}</p>
                </div>
                <button
                  onClick={() => { if (confirm('Delete this note?')) router.delete(`/admin/users/${user.id}/notes/${note.id}`) }}
                  className="text-stone-600 hover:text-red-400 transition-colors shrink-0 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-stone-600 text-sm">No notes yet.</p>
        )}
      </div>

      <div className="mb-10">
        <h2 className="text-xl font-headline font-bold text-[#e5e2e1] tracking-tight mb-2">Kudos</h2>
        <p className="text-stone-500 text-sm mb-4">Public shoutouts shown on the user's profile.</p>

        <div className="mb-4">
          <textarea
            value={kudoContent}
            onChange={(e) => setKudoContent(e.target.value)}
            placeholder="Give them some kudos..."
            rows={3}
            className="w-full bg-[#0e0e0e] border-none px-4 py-3 text-sm text-[#e5e2e1] focus:ring-1 focus:ring-[#ee671c]/30 placeholder:text-stone-600 resize-y mb-2"
          />
          <button
            onClick={() => {
              if (!kudoContent.trim()) return
              router.post(`/admin/users/${user.id}/add_kudo`, { content: kudoContent })
              setKudoContent('')
            }}
            disabled={!kudoContent.trim()}
            className="signature-smolder text-[#4c1a00] px-5 py-2 text-xs font-bold uppercase tracking-[0.15em] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add Kudos
          </button>
        </div>

        {kudos.length > 0 ? (
          <div className="space-y-2">
            {kudos.map((kudo) => (
              <div key={kudo.id} className="bg-[#1c1b1b] ghost-border px-5 py-4 flex gap-3">
                <img src={kudo.author_avatar} alt={kudo.author_name} className="w-8 h-8 border border-white/10 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-headline font-bold text-[#e5e2e1] text-sm">{kudo.author_name}</span>
                    <span className="text-stone-600 text-xs">{kudo.created_at}</span>
                  </div>
                  <p className="text-stone-300 text-sm whitespace-pre-wrap break-words">{kudo.content}</p>
                </div>
                <button
                  onClick={() => { if (confirm('Delete this kudos?')) router.delete(`/admin/users/${user.id}/kudos/${kudo.id}`) }}
                  className="text-stone-600 hover:text-red-400 transition-colors shrink-0 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-stone-600 text-sm">No kudos yet.</p>
        )}
      </div>

      {can.destroy && (
        <div className="mb-10">
          <h2 className="text-xl font-headline font-bold text-[#e5e2e1] tracking-tight mb-4">Ban Status</h2>
          {user.is_banned ? (
            <div className="border border-red-500/20 p-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-red-400">gavel</span>
                <span className="text-red-400 font-headline font-bold uppercase tracking-wider text-sm">Banned</span>
              </div>
              {user.ban_reason && (
                <div className="bg-red-500/5 ghost-border p-4 mb-4">
                  <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-600">Reason</span>
                  <p className="text-stone-300 text-sm mt-1">{user.ban_reason}</p>
                </div>
              )}
              <button
                onClick={handleUnban}
                className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/30 hover:text-emerald-300 px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] transition-colors cursor-pointer flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">lock_open</span>
                Unban User
              </button>
            </div>
          ) : (
            <div className="ghost-border bg-[#1c1b1b] p-6">
              {!showBanForm ? (
                <button
                  onClick={() => setShowBanForm(true)}
                  className="bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30 hover:text-red-300 px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] transition-colors cursor-pointer flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-lg">gavel</span>
                  Ban User
                </button>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-[0.2em] text-stone-500 mb-2">
                      Reason for ban
                    </label>
                    <textarea
                      value={banReason}
                      onChange={(e) => setBanReason(e.target.value)}
                      rows={3}
                      className="w-full bg-[#0e0e0e] border-none px-4 py-3 text-[#e5e2e1] text-sm focus:ring-1 focus:ring-[#ee671c]/30 placeholder:text-stone-600 resize-y"
                      placeholder="Why is this user being banned?"
                      required
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleBan}
                      className="bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30 hover:text-red-300 px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] transition-colors cursor-pointer flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-lg">gavel</span>
                      Confirm Ban
                    </button>
                    <button
                      onClick={() => { setShowBanForm(false); setBanReason('') }}
                      className="ghost-border text-stone-400 hover:text-[#e5e2e1] px-6 py-3 text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <h2 className="text-xl font-headline font-bold text-[#e5e2e1] tracking-tight mb-4">Projects ({projects.length})</h2>

      {projects.length > 0 ? (
        <div className="space-y-2">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/admin/projects/${project.id}`}
              className="block bg-[#1c1b1b] ghost-border px-5 py-4 hover:bg-[#2a2a2a] transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="font-headline font-bold text-[#e5e2e1] group-hover:text-[#ffb595] transition-colors">{project.name}</span>
                <div className="flex items-center gap-4 text-xs text-stone-500">
                  <span>{project.ships_count} ships</span>
                  <span>{project.created_at}</span>
                  <span className="material-symbols-outlined text-stone-600 group-hover:text-[#ffb595] transition-colors text-sm">arrow_forward</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-stone-500">No projects yet.</p>
      )}

      {can.restore && (
        <div className="mt-16 ghost-border bg-[#1c1b1b] p-6">
          <h2 className="text-xl font-headline font-bold text-emerald-400 tracking-tight mb-2">Restore</h2>
          <p className="text-stone-500 text-sm mb-4">This user is soft-deleted. Restore them to make their account active again.</p>
          <button
            onClick={handleRestore}
            className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/30 hover:text-emerald-300 px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] transition-colors cursor-pointer flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">restore</span>
            Restore User
          </button>
        </div>
      )}

      {can.destroy && (
        <div className={`${can.restore ? 'mt-4' : 'mt-16'} border border-red-500/20 p-6`}>
          <h2 className="text-xl font-headline font-bold text-red-400 tracking-tight mb-2">Danger Zone</h2>
          <p className="text-stone-500 text-sm mb-4">
            {user.is_discarded
              ? 'This user is soft-deleted. You can permanently destroy their account.'
              : 'Deleting this user will soft-delete their account. They will no longer be able to sign in.'}
          </p>
          <button
            onClick={handleDelete}
            className="bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30 hover:text-red-300 px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] transition-colors cursor-pointer flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">delete_forever</span>
            {user.is_discarded ? 'Permanently Destroy' : 'Delete User'}
          </button>
        </div>
      )}
    </div>
  )
}
