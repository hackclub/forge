import { Flag, Loader2 } from 'lucide-react'
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
import { Textarea } from '@/components/admin/ui/textarea'

export function FlagDialog({
  open,
  onOpenChange,
  reason,
  setReason,
  onSubmit,
  submitting,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  reason: string
  setReason: (v: string) => void
  onSubmit: () => void
  submitting: boolean
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Flag for review</AlertDialogTitle>
          <AlertDialogDescription>
            Pulls this project out of the queue pending investigation. It will still stay pending but it will be investigated!
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Why are you flagging this? (recorded in the audit log)"
          className="h-24 text-sm"
        />
        <AlertDialogFooter>
          <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
          <Button variant="destructive" size="sm" onClick={onSubmit} disabled={submitting || !reason.trim()}>
            {submitting ? <Loader2 className="size-4 animate-spin" /> : <Flag className="size-4" />}
            Flag
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
