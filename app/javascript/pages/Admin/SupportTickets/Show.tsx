import { useState } from 'react'
import { Link, router } from '@inertiajs/react'
import type { AdminSupportTicketRow, SupportThreadMessage, SupportTicketStatus } from '@/types'

const statusConfig: Record<SupportTicketStatus, { label: string; bg: string; text: string }> = {
  open: { label: 'Open', bg: 'bg-amber-500/10', text: 'text-amber-400' },
  claimed: { label: 'Claimed', bg: 'bg-blue-500/10', text: 'text-blue-400' },
  resolved: { label: 'Resolved', bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
}

export default function AdminSupportTicketsShow({
  ticket,
  messages,
  can,
}: {
  ticket: AdminSupportTicketRow
  messages: SupportThreadMessage[]
  can: { reply: boolean; claim: boolean; resolve: boolean; destroy: boolean }
}) {
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)

  function handleReply(e: React.FormEvent) {
    e.preventDefault()
    if (!replyText.trim() || sending) return
    setSending(true)
    router.post(`/admin/support/${ticket.id}/reply`, { message: replyText }, {
      onFinish: () => {
        setReplyText('')
        setSending(false)
      },
    })
  }

  const status = statusConfig[ticket.status]

  return (
    <div className="p-5 md:p-12 max-w-4xl mx-auto">
      <Link
        href="/admin/support"
        className="inline-flex items-center gap-1.5 text-stone-500 hover:text-[#e5e2e1] text-xs font-bold uppercase tracking-[0.2em] transition-colors mb-6"
      >
        <span className="material-symbols-outlined text-sm">arrow_back</span>
        Back to Support
      </Link>

      <div className="flex items-start gap-4 mb-6">
        {ticket.slack_avatar_url ? (
          <img src={ticket.slack_avatar_url} alt={ticket.slack_display_name} className="w-12 h-12 border border-white/10 shrink-0" />
        ) : (
          <div className="w-12 h-12 bg-stone-700 flex items-center justify-center text-stone-400 font-bold shrink-0">
            {ticket.slack_display_name?.[0] || '?'}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-headline font-bold text-[#e5e2e1] tracking-tight">{ticket.slack_display_name}</h1>
            <span className={`px-2 py-0.5 text-[9px] uppercase font-bold tracking-widest ${status.bg} ${status.text}`}>
              {status.label}
            </span>
          </div>
          <p className="text-stone-500 text-xs">{ticket.created_at}</p>
          {ticket.claimed_by_name && (
            <p className="text-stone-500 text-xs mt-1">Claimed by {ticket.claimed_by_name}</p>
          )}
          {ticket.resolved_by_name && (
            <p className="text-stone-500 text-xs mt-1">Resolved by {ticket.resolved_by_name} {ticket.resolved_at ? `at ${ticket.resolved_at}` : ''}</p>
          )}
        </div>
      </div>

      <div className="flex gap-2 mb-8">
        {ticket.slack_thread_url && (
          <a
            href={ticket.slack_thread_url}
            target="_blank"
            rel="noopener noreferrer"
            className="ghost-border bg-[#1c1b1b] text-stone-400 hover:bg-[#2a2a2a] hover:text-[#e5e2e1] px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] transition-colors inline-flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">open_in_new</span>
            View in Slack
          </a>
        )}
        {can.claim && !ticket.resolved_by_name && ticket.status !== 'claimed' && (
          <button
            onClick={() => router.post(`/admin/support/${ticket.id}/claim`)}
            className="ghost-border bg-[#1c1b1b] text-blue-400 hover:bg-blue-500/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] transition-colors cursor-pointer inline-flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">person_add</span>
            Claim
          </button>
        )}
        {can.resolve && ticket.status !== 'resolved' && (
          <button
            onClick={() => { if (confirm('Mark this ticket as resolved?')) router.post(`/admin/support/${ticket.id}/resolve`) }}
            className="signature-smolder text-[#4c1a00] px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] cursor-pointer inline-flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">check_circle</span>
            Resolve
          </button>
        )}
        {can.destroy && (
          <button
            onClick={() => { if (confirm('Permanently delete this ticket? This cannot be undone.')) router.delete(`/admin/support/${ticket.id}`) }}
            className="bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30 px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] transition-colors cursor-pointer inline-flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">delete_forever</span>
            Delete
          </button>
        )}
      </div>

      <div className="space-y-1 mb-8">
        {messages.map((msg) => (
          <div key={msg.ts} className="flex gap-3 bg-[#1c1b1b] ghost-border px-5 py-4">
            <div className="w-8 h-8 shrink-0">
              {msg.avatar_url ? (
                <img src={msg.avatar_url} alt={msg.display_name} className="w-8 h-8 border border-white/10" />
              ) : (
                <div className="w-8 h-8 bg-stone-700 flex items-center justify-center text-stone-400 text-xs font-bold">
                  {msg.display_name?.[0] || '?'}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-headline font-bold text-[#e5e2e1] text-sm">{msg.display_name}</span>
                <span className="text-stone-600 text-xs">{msg.created_at}</span>
              </div>
              <p className="text-stone-300 text-sm whitespace-pre-wrap break-words">{msg.text}</p>
            </div>
          </div>
        ))}
        {messages.length === 0 && (
          <p className="text-stone-500 text-sm py-4 text-center">No messages yet.</p>
        )}
      </div>

      {can.reply && (
        <form onSubmit={handleReply} className="flex gap-2">
          <input
            type="text"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Type a reply..."
            className="bg-[#0e0e0e] border-none px-4 py-3 text-sm text-[#e5e2e1] focus:ring-1 focus:ring-[#ee671c]/30 placeholder:text-stone-600 flex-1"
          />
          <button
            type="submit"
            disabled={sending || !replyText.trim()}
            className="signature-smolder text-[#4c1a00] px-6 py-3 text-xs font-bold uppercase tracking-[0.15em] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">send</span>
            Send
          </button>
        </form>
      )}
    </div>
  )
}
