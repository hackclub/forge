import { useState } from 'react'
import Markdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize from 'rehype-sanitize'
import remarkGfm from 'remark-gfm'
import { Check, Clock, Copy, RefreshCw } from 'lucide-react'
import { Badge } from '@/components/admin/ui/badge'
import { Button } from '@/components/admin/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/admin/ui/tabs'
import { cn } from '@/components/admin/lib/cn'
import AdminReviewTimeline, { type ReviewEvent } from '@/components/admin/AdminReviewTimeline'
import { AiCheckPanel } from './AiCheckPanel'
import { RepoTree } from './RepoTree'
import { NotesPanel } from './NotesPanel'
import type { AiCheckResult, ReviewNote, ReviewProject } from './types'

function CopyJournalButton({ url, label }: { url: string; label: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => {
        navigator.clipboard
          ?.writeText(url)
          .then(() => {
            setCopied(true)
            window.setTimeout(() => setCopied(false), 1500)
          })
          .catch(() => {})
      }}
    >
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      {copied ? 'Copied' : label}
    </Button>
  )
}

function CopyDevlogLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard
          ?.writeText(url)
          .then(() => {
            setCopied(true)
            window.setTimeout(() => setCopied(false), 1500)
          })
          .catch(() => {})
      }}
      className="ml-auto flex items-center gap-1 text-muted-foreground hover:text-foreground cursor-pointer"
      title="Copy link to this entry"
    >
      {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
      {copied ? 'Copied' : 'Copy link'}
    </button>
  )
}

export function ContentTabs({
  project,
  notes,
  reviewHistory,
  readmeRefreshing,
  onRefreshReadme,
  aiResult,
  aiRanAt,
  aiChecking,
  onRunAiCheck,
  value,
  onValueChange,
  currentUserId,
  isSuperadmin,
}: {
  project: ReviewProject
  notes: ReviewNote[]
  reviewHistory: ReviewEvent[]
  readmeRefreshing: boolean
  onRefreshReadme: () => void
  aiResult: AiCheckResult | null
  aiRanAt: string | null
  aiChecking: boolean
  onRunAiCheck: () => void
  value: string
  onValueChange: (v: string) => void
  currentUserId: number
  isSuperadmin: boolean
}) {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://forge.hackclub.com'
  const isGitJournal = project.devlog_mode === 'git'
  const journalUrl = isGitJournal ? (project.git_journal_url ?? project.repo_link ?? null) : null

  return (
    <Tabs value={value} onValueChange={onValueChange} className="w-full">
      <TabsList>
        <TabsTrigger value="journal">Journal ({project.devlogs.length})</TabsTrigger>
        <TabsTrigger value="readme">README</TabsTrigger>
        <TabsTrigger value="pitch">Pitch</TabsTrigger>
        <TabsTrigger value="description">Description</TabsTrigger>
        <TabsTrigger value="notes">Notes ({notes.length})</TabsTrigger>
        <TabsTrigger value="timeline">Timeline</TabsTrigger>
        <TabsTrigger value="ai_check">AI Check</TabsTrigger>
        <TabsTrigger value="files">Files</TabsTrigger>
      </TabsList>

      <TabsContent value="journal">
        {journalUrl && (
          <div className="mb-2">
            <CopyJournalButton url={journalUrl} label="Copy JOURNAL.md link" />
          </div>
        )}
        {project.devlogs.length === 0 ? (
          <p className="text-sm text-muted-foreground p-3">No devlog entries yet.</p>
        ) : (
          <div className="space-y-2">
            {project.devlogs.map((entry) => (
              <div
                key={entry.id}
                className="rounded-md border border-border bg-card p-3 space-y-2 hover:bg-muted/20 transition-colors"
              >
                <div className="flex items-center gap-2 text-xs flex-wrap">
                  <span className="font-semibold text-sm text-foreground">{entry.title}</span>
                  {project.is_group_project && (
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <img src={entry.user_avatar} alt="" className="size-3.5 rounded-full" />
                      {entry.user_display_name}
                    </span>
                  )}
                  <span className="text-muted-foreground">·</span>
                  <span className="text-muted-foreground">{entry.created_at}</span>
                  {entry.time_spent && (
                    <>
                      <span className="text-muted-foreground">·</span>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="size-3" />
                        {entry.time_spent}
                        {entry.time_hours != null && (
                          <span className="font-mono">({entry.time_hours.toFixed(1)}h)</span>
                        )}
                      </span>
                    </>
                  )}
                  {entry.lapse_url && (
                    <>
                      <span className="text-muted-foreground">·</span>
                      <a
                        href={entry.lapse_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-foreground hover:underline"
                      >
                        Lapse ↗
                      </a>
                    </>
                  )}
                  {!entry.meets_requirements && <Badge variant="warning">Below requirements</Badge>}
                  {!isGitJournal && <CopyDevlogLink url={`${origin}/projects/${project.id}/devlogs/${entry.id}`} />}
                </div>
                <div className="markdown-content text-sm">
                  <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw, rehypeSanitize]}>
                    {entry.content}
                  </Markdown>
                </div>
              </div>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="readme">
        {project.readme_cache ? (
          <div className="rounded-md border border-border bg-card p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground">Fetched {project.readme_fetched_at || '—'}</p>
              <Button variant="outline" size="sm" disabled={readmeRefreshing} onClick={onRefreshReadme}>
                <RefreshCw className={cn('size-3.5', readmeRefreshing && 'animate-spin')} />
                {readmeRefreshing ? 'Fetching…' : 'Refresh'}
              </Button>
            </div>
            <div className="markdown-content text-sm">
              <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw, rehypeSanitize]}>
                {project.readme_cache}
              </Markdown>
            </div>
          </div>
        ) : (
          <div className="rounded-md border border-border bg-card p-6 text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              {project.repo_link
                ? 'No README cached yet — pull it now.'
                : "No repository linked, so there's no README to fetch."}
            </p>
            {project.repo_link && (
              <Button onClick={onRefreshReadme} disabled={readmeRefreshing}>
                <RefreshCw className={cn('size-4', readmeRefreshing && 'animate-spin')} />
                {readmeRefreshing ? 'Fetching…' : 'Cache README'}
              </Button>
            )}
          </div>
        )}
      </TabsContent>

      <TabsContent value="pitch">
        {project.pitch_text ? (
          <div className="rounded-md border border-border bg-card p-3 markdown-content text-sm">
            <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw, rehypeSanitize]}>
              {project.pitch_text}
            </Markdown>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground p-3">No pitch text on this project.</p>
        )}
      </TabsContent>

      <TabsContent value="description">
        {project.description ? (
          <div className="rounded-md border border-border bg-card p-3 text-sm whitespace-pre-wrap">
            {project.description}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground p-3">No description.</p>
        )}
      </TabsContent>

      <TabsContent value="notes">
        <NotesPanel notes={notes} projectId={project.id} currentUserId={currentUserId} isSuperadmin={isSuperadmin} />
      </TabsContent>

      <TabsContent value="timeline">
        {reviewHistory.length === 0 ? (
          <p className="text-sm text-muted-foreground p-3">No timeline events yet.</p>
        ) : (
          <AdminReviewTimeline events={reviewHistory} defaultExpanded />
        )}
      </TabsContent>

      <TabsContent value="ai_check">
        <AiCheckPanel result={aiResult} ranAt={aiRanAt} running={aiChecking} onRun={onRunAiCheck} />
      </TabsContent>

      <TabsContent value="files">
        <RepoTree projectId={project.id} hasRepo={!!project.repo_link} />
      </TabsContent>
    </Tabs>
  )
}
