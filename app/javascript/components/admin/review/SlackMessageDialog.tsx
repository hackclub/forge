import { Loader2, Send } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/admin/ui/alert-dialog'
import { Button } from '@/components/admin/ui/button'
import { Input } from '@/components/admin/ui/input'
import { Textarea } from '@/components/admin/ui/textarea'

export function SlackMessageDialog({
  open,
  onOpenChange,
  title,
  description,
  intro,
  outro,
  slackId,
  setSlackId,
  body,
  setBody,
  sending,
  onSend,
  slackIdMissing,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  intro: string
  outro: string
  slackId: string
  setSlackId: (v: string) => void
  body: string
  setBody: (v: string) => void
  sending: boolean
  onSend: () => void
  slackIdMissing: boolean
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-xl">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Builder Slack ID</label>
            <Input
              value={slackId}
              onChange={(e) => setSlackId(e.target.value)}
              placeholder="U0123456789"
              className="h-8 font-mono text-sm"
            />
            {slackIdMissing && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400">
                No Slack ID on file for this user, enter one manually.
              </p>
            )}
          </div>
          <div className="rounded-md border border-border bg-muted/30 p-3 text-sm whitespace-pre-wrap">{intro}</div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Message body</label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="What does the builder need to know?"
              className="h-32 text-sm"
            />
          </div>
          <div className="rounded-md border border-border bg-muted/30 p-3 text-sm whitespace-pre-wrap">{outro}</div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={sending}>Cancel</AlertDialogCancel>
          <Button size="sm" onClick={onSend} disabled={sending}>
            {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            Send
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
