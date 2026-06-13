import { useState } from 'react'
import { Link } from '@inertiajs/react'
import {
  ArrowLeft,
  Check,
  Copy,
  ExternalLink,
  Flag,
  GitBranch,
  Keyboard,
  StickyNote,
  User as UserIcon,
} from 'lucide-react'
import { Button } from '@/components/admin/ui/button'
import { Separator } from '@/components/admin/ui/separator'
import { isSafeUrl, statusBadge } from './helpers'
import type { ReviewProject, ReviewSession } from './types'

export function ReviewTopBar({
  project,
  session,
  nextPendingId,
  onTrack,
  onShowHelp,
  notesCount,
  onToggleNotes,
  flagged,
  onFlag,
  commitsUrl,
  demoUrl,
}: {
  project: ReviewProject
  session: ReviewSession | null
  nextPendingId: number | null
  onTrack: (button: string, metadata?: Record<string, unknown>) => void
  onShowHelp: () => void
  notesCount: number
  onToggleNotes: () => void
  flagged: boolean
  onFlag: () => void
  commitsUrl: string | null
  demoUrl: string | null
}) {
  const [copied, setCopied] = useState(false)
  const copyRepo = () => {
    if (!isSafeUrl(project.repo_link)) return
    navigator.clipboard
      ?.writeText(project.repo_link)
      .then(() => {
        setCopied(true)
        window.setTimeout(() => setCopied(false), 1500)
      })
      .catch(() => {})
  }

  return (
    <div className="z-40 bg-gradient-to-b from-card to-card/60 border-b border-border px-4 py-2 flex items-center gap-2 shrink-0 flex-wrap">
      <Button variant="outline" size="sm" asChild onClick={() => onTrack('end_session')}>
        <Link href="/admin/reviews">
          <ArrowLeft className="size-4" />
          End Session
        </Link>
      </Button>
      {nextPendingId && (
        <Button variant="ghost" size="sm" asChild onClick={() => onTrack('skip', { next_id: nextPendingId })}>
          <Link href={`/admin/reviews/${nextPendingId}`}>Skip</Link>
        </Button>
      )}

      {session && (
        <span
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"
          title="Your review session is active. Time is being recorded — refresh-safe, resumes the same session."
        >
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75 animate-ping" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
          </span>
          Session active
        </span>
      )}

      <Separator orientation="vertical" className="h-6" />

      <a
        href={`/admin/projects/${project.id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="font-semibold truncate hover:underline"
      >
        {project.name}
      </a>
      <span className="text-sm text-muted-foreground">
        by{' '}
        <a
          href={`/admin/users/${project.user_id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline text-foreground"
        >
          {project.user_display_name}
        </a>
      </span>
      {statusBadge(project.status)}

      <div className="flex items-center gap-1.5 ml-auto">
        <Button variant="ghost" size="sm" onClick={onToggleNotes} title="Notes (n)">
          <StickyNote className="size-4" />
          Notes{notesCount > 0 ? ` (${notesCount})` : ''}
        </Button>
        {!flagged && (
          <Button variant="ghost" size="sm" onClick={onFlag} title="Flag for review">
            <Flag className="size-4" />
            Flag
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onShowHelp}
          title="Keyboard shortcuts (?)"
          aria-label="Keyboard shortcuts"
        >
          <Keyboard className="size-4" />
        </Button>

        <Separator orientation="vertical" className="h-6" />

        <Button variant="outline" size="sm" asChild onClick={() => onTrack('open_user')}>
          <a href={`/admin/users/${project.user_id}`} target="_blank" rel="noopener noreferrer">
            <UserIcon className="size-4" />
            User
          </a>
        </Button>
        {isSafeUrl(project.repo_link) && (
          <>
            <Button
              variant="outline"
              size="sm"
              asChild
              onClick={() => onTrack('open_repo', { url: project.repo_link })}
            >
              <a href={project.repo_link} target="_blank" rel="noopener noreferrer">
                <GitBranch className="size-4" />
                Repo
              </a>
            </Button>
            <Button variant="ghost" size="icon" onClick={copyRepo} title="Copy repo URL" aria-label="Copy repo URL">
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            </Button>
          </>
        )}
        {isSafeUrl(commitsUrl) && (
          <Button variant="outline" size="sm" asChild>
            <a href={commitsUrl} target="_blank" rel="noopener noreferrer">
              <GitBranch className="size-4" />
              Commits
            </a>
          </Button>
        )}
        {isSafeUrl(demoUrl) && (
          <Button variant="outline" size="sm" asChild>
            <a href={demoUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="size-4" />
              Demo
            </a>
          </Button>
        )}
        <Button variant="outline" size="sm" asChild onClick={() => onTrack('open_public')}>
          <a href={`/projects/${project.id}`} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="size-4" />
            Public
          </a>
        </Button>
      </div>
    </div>
  )
}
