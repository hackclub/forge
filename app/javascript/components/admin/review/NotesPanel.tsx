import { useState } from 'react'
import { router } from '@inertiajs/react'
import { Check, Pencil, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/admin/ui/button'
import { Textarea } from '@/components/admin/ui/textarea'
import type { ReviewNote } from './types'

export function NotesPanel({
  notes,
  projectId,
  currentUserId,
  isSuperadmin,
}: {
  notes: ReviewNote[]
  projectId: number
  currentUserId: number
  isSuperadmin: boolean
}) {
  const [draft, setDraft] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editContent, setEditContent] = useState('')
  const [busy, setBusy] = useState(false)

  const opts = {
    preserveState: true as const,
    preserveScroll: true as const,
    onStart: () => setBusy(true),
    onFinish: () => setBusy(false),
  }

  const addNote = () => {
    const content = draft.trim()
    if (!content) return
    router.post(`/admin/projects/${projectId}/add_note`, { content }, { ...opts, onSuccess: () => setDraft('') })
  }
  const saveEdit = (noteId: number) => {
    const content = editContent.trim()
    if (!content) return
    router.patch(
      `/admin/projects/${projectId}/notes/${noteId}`,
      { content },
      { ...opts, onSuccess: () => setEditingId(null) },
    )
  }
  const deleteNote = (noteId: number) => {
    if (!confirm('Delete this note?')) return
    router.delete(`/admin/projects/${projectId}/notes/${noteId}`, opts)
  }

  return (
    <div className="space-y-3">
      <div className="rounded-md border border-border bg-card p-3 space-y-2">
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add an internal note… (only reviewers see these)"
          className="h-20 text-sm"
        />
        <Button size="sm" onClick={addNote} disabled={busy || !draft.trim()}>
          <Plus className="size-3.5" />
          Add note
        </Button>
      </div>

      {notes.length === 0 ? (
        <p className="text-sm text-muted-foreground p-3">No internal notes yet.</p>
      ) : (
        <div className="space-y-2">
          {notes.map((note) => {
            const canEdit = note.author_id === currentUserId || isSuperadmin
            return (
              <div key={note.id} className="rounded-md border border-border bg-card p-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <img src={note.author_avatar} alt="" className="size-5 rounded-full" />
                  <strong className="text-foreground">{note.author_name}</strong>
                  <span>· {note.created_at}</span>
                  {note.edited && <span>· edited</span>}
                  {canEdit && editingId !== note.id && (
                    <span className="ml-auto flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(note.id)
                          setEditContent(note.content)
                        }}
                        className="hover:text-foreground cursor-pointer"
                        title="Edit"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteNote(note.id)}
                        className="hover:text-red-500 cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </span>
                  )}
                </div>
                {editingId === note.id ? (
                  <div className="mt-2 space-y-1.5">
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="h-20 text-sm"
                    />
                    <div className="flex gap-1.5">
                      <Button size="sm" onClick={() => saveEdit(note.id)} disabled={busy || !editContent.trim()}>
                        <Check className="size-3.5" />
                        Save
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm whitespace-pre-wrap mt-1.5">{note.content}</p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
