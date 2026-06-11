import { useState } from 'react'
import { router } from '@inertiajs/react'

export interface PendingCollaborationInvite {
  id: number
  project_id: number
  project_name: string
  project_cover_image_url: string | null
  inviter_display_name: string
  inviter_avatar: string
  created_at: string
}

export default function CollaborationInvitesCard({ invites }: { invites: PendingCollaborationInvite[] }) {
  const [busyId, setBusyId] = useState<number | null>(null)

  function respond(invite: PendingCollaborationInvite, action: 'accept' | 'decline') {
    setBusyId(invite.id)
    router.post(`/collaboration_invites/${invite.id}/${action}`, {}, { onFinish: () => setBusyId(null) })
  }

  return (
    <section className="bg-[#1c1b1b] ghost-border p-6 sm:p-8">
      <div className="flex items-center gap-2 mb-5">
        <span className="material-symbols-outlined text-[#ffb595]">group_add</span>
        <h2 className="text-xl font-headline font-bold text-[#e5e2e1] tracking-tight">Project invites</h2>
      </div>
      <ul className="space-y-3">
        {invites.map((invite) => (
          <li key={invite.id} className="bg-[#0e0e0e] ghost-border p-4 flex items-center gap-4 flex-wrap">
            <img
              src={invite.project_cover_image_url || '/orph-building.png'}
              alt=""
              className="w-12 h-12 object-cover border border-white/10 shrink-0 hidden sm:block"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-[#e5e2e1]">
                <span className="font-headline font-bold">{invite.inviter_display_name}</span> invited you to join{' '}
                <span className="font-headline font-bold text-[#ffb595]">{invite.project_name}</span>
              </p>
              <p className="text-[10px] uppercase tracking-[0.2em] text-stone-600 mt-1">{invite.created_at}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => respond(invite, 'accept')}
                disabled={busyId === invite.id}
                className="signature-smolder text-[#4c1a00] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.15em] cursor-pointer disabled:opacity-50"
              >
                Accept
              </button>
              <button
                onClick={() => respond(invite, 'decline')}
                disabled={busyId === invite.id}
                className="ghost-border text-stone-400 hover:text-red-400 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.15em] transition-colors cursor-pointer disabled:opacity-50"
              >
                Decline
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
