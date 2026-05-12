import { useState } from 'react'
import { Link, router } from '@inertiajs/react'
import { ArrowLeft, ExternalLink, UserPlus, CheckCircle2, Trash2, Send } from 'lucide-react'
import { Badge } from '@/components/admin/ui/badge'
import { Button } from '@/components/admin/ui/button'
import { Card, CardContent } from '@/components/admin/ui/card'
import { Input } from '@/components/admin/ui/input'
import type { AdminSupportTicketRow, SupportThreadMessage, SupportTicketStatus } from '@/types'

function statusBadge(status: SupportTicketStatus) {
  switch (status) {
    case 'open':
      return <Badge variant="warning">Open</Badge>
    case 'claimed':
      return <Badge variant="secondary">Claimed</Badge>
    case 'resolved':
      return <Badge variant="success">Resolved</Badge>
  }
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
    router.post(
      `/admin/support/${ticket.id}/reply`,
      { message: replyText },
      {
        onFinish: () => {
          setReplyText('')
          setSending(false)
        },
      },
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/admin/support">
          <ArrowLeft className="size-4" />
          Back to Support
        </Link>
      </Button>

      <div className="flex items-start gap-4">
        {ticket.slack_avatar_url ? (
          <img src={ticket.slack_avatar_url} alt="" className="size-12 rounded-full shrink-0" />
        ) : (
          <div className="size-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-medium shrink-0">
            {ticket.slack_display_name?.[0] || '?'}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-semibold tracking-tight">{ticket.slack_display_name}</h1>
            {statusBadge(ticket.status)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">{ticket.created_at}</p>
          {ticket.claimed_by_name && (
            <p className="text-xs text-muted-foreground">Claimed by {ticket.claimed_by_name}</p>
          )}
          {ticket.resolved_by_name && (
            <p className="text-xs text-muted-foreground">
              Resolved by {ticket.resolved_by_name}
              {ticket.resolved_at ? ` at ${ticket.resolved_at}` : ''}
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {ticket.slack_thread_url && (
          <Button asChild variant="outline" size="sm">
            <a href={ticket.slack_thread_url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="size-4" />
              View in Slack
            </a>
          </Button>
        )}
        {can.claim && !ticket.resolved_by_name && ticket.status !== 'claimed' && (
          <Button variant="outline" size="sm" onClick={() => router.post(`/admin/support/${ticket.id}/claim`)}>
            <UserPlus className="size-4" />
            Claim
          </Button>
        )}
        {can.resolve && ticket.status !== 'resolved' && (
          <Button
            size="sm"
            onClick={() => {
              if (confirm('Mark this ticket as resolved?')) router.post(`/admin/support/${ticket.id}/resolve`)
            }}
          >
            <CheckCircle2 className="size-4" />
            Resolve
          </Button>
        )}
        {can.destroy && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              if (confirm('Permanently delete this ticket?')) router.delete(`/admin/support/${ticket.id}`)
            }}
          >
            <Trash2 className="size-4" />
            Delete
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {messages.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground text-center">No messages yet.</CardContent>
          </Card>
        ) : (
          messages.map((msg) => (
            <Card key={msg.ts}>
              <CardContent className="p-3 flex gap-3">
                {msg.avatar_url ? (
                  <img src={msg.avatar_url} alt="" className="size-8 rounded-full shrink-0" />
                ) : (
                  <div className="size-8 rounded-full bg-muted flex items-center justify-center text-xs text-muted-foreground shrink-0">
                    {msg.display_name?.[0] || '?'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{msg.display_name}</span>
                    <span className="text-xs text-muted-foreground">{msg.created_at}</span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap break-words mt-1">{msg.text}</p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {can.reply && (
        <form onSubmit={handleReply} className="flex gap-2">
          <Input
            type="text"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Type a reply…"
            className="flex-1"
          />
          <Button type="submit" disabled={sending || !replyText.trim()}>
            <Send className="size-4" />
            Send
          </Button>
        </form>
      )}
    </div>
  )
}
