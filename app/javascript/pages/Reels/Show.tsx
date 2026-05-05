import { useEffect, useRef, useState } from 'react'
import { Head, Link, router, usePage } from '@inertiajs/react'
import type { SharedProps } from '@/types'

interface ReelImage {
  id: number
  url: string
  position: number
}

interface Reel {
  id: number
  title: string | null
  kind: 'video' | 'image_carousel' | 'slideshow' | string
  video_url: string | null
  audio_url: string | null
  duration_seconds: number | null
  kudos_count: number
  comments_count: number
  views_count: number
  kudoed: boolean
  created_at: string
  images: ReelImage[]
  project: { id: number; name: string }
  user: { id: number; display_name: string; avatar: string }
}

interface Comment {
  id: number
  body: string
  parent_id: number | null
  created_at: string
  can_destroy: boolean
  user: { id: number; display_name: string; avatar: string }
  replies?: Comment[]
}

const VIEW_THRESHOLD_MS = 2000
let viewRecorded = false

function formatCount(n: number): string {
  if (!n) return '0'
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K`
  return String(n)
}

function csrfToken(): string {
  return document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content || ''
}

function ActionButton({
  icon,
  label,
  active,
  onClick,
  ariaLabel,
}: {
  icon: string
  label?: string
  active?: boolean
  onClick: (e: React.MouseEvent) => void
  ariaLabel: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className="flex flex-col items-center gap-1 active:scale-90 transition-transform cursor-pointer"
    >
      <span className="w-12 h-12 rounded-full bg-white/10 backdrop-blur flex items-center justify-center">
        <span
          className="material-symbols-outlined text-2xl"
          style={{
            color: active ? '#ee671c' : '#ffffff',
            fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0",
          }}
        >
          {icon}
        </span>
      </span>
      {label !== undefined && <span className="text-white text-xs font-bold drop-shadow">{label}</span>}
    </button>
  )
}

function CommentsPanel({
  reel,
  onClose,
  onCountChange,
}: {
  reel: Reel
  onClose: () => void
  onCountChange: (delta: number) => void
}) {
  const [comments, setComments] = useState<Comment[] | null>(null)
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [replyingTo, setReplyingTo] = useState<number | null>(null)
  const [expanded, setExpanded] = useState<Set<number>>(new Set())
  const currentUser = usePage<SharedProps>().props.auth.user

  useEffect(() => {
    let cancelled = false
    setComments(null)
    setError(null)
    fetch(`/reels/${reel.id}/comments`, {
      headers: { Accept: 'application/json' },
      credentials: 'same-origin',
    })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((data) => {
        if (!cancelled) setComments(Array.isArray(data.comments) ? data.comments : [])
      })
      .catch((e) => {
        if (!cancelled) {
          setError(`Couldn't load comments (${e.message})`)
          setComments([])
        }
      })
    return () => {
      cancelled = true
    }
  }, [reel.id])

  function postComment(text: string, parentId: number | null): Promise<Comment | null> {
    return fetch(`/reels/${reel.id}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-CSRF-Token': csrfToken(),
      },
      credentials: 'same-origin',
      body: JSON.stringify({ body: text, parent_id: parentId }),
    })
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((data) => (data.comment ? (data.comment as Comment) : null))
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!body.trim() || submitting) return
    setSubmitting(true)
    setError(null)
    postComment(body, null)
      .then((c) => {
        if (c) {
          setComments((prev) => (prev ? [{ ...c, replies: [] }, ...prev] : [{ ...c, replies: [] }]))
          setBody('')
          onCountChange(1)
        }
      })
      .catch((e) => setError(`Failed to post (${e.message})`))
      .finally(() => setSubmitting(false))
  }

  function submitReply(parentId: number, text: string) {
    return postComment(text, parentId).then((c) => {
      if (!c) return
      setComments((prev) =>
        prev
          ? prev.map((top) =>
              top.id === parentId ? { ...top, replies: [...(top.replies ?? []), c] } : top,
            )
          : prev,
      )
      setExpanded((prev) => new Set(prev).add(parentId))
      setReplyingTo(null)
      onCountChange(1)
    })
  }

  function destroy(commentId: number, parentId: number | null) {
    fetch(`/reels/${reel.id}/comments/${commentId}`, {
      method: 'DELETE',
      headers: { 'X-CSRF-Token': csrfToken() },
      credentials: 'same-origin',
    }).then((r) => {
      if (!r.ok) return
      setComments((prev) => {
        if (!prev) return prev
        if (parentId == null) {
          const removed = prev.find((c) => c.id === commentId)
          const dropped = 1 + (removed?.replies?.length ?? 0)
          onCountChange(-dropped)
          return prev.filter((c) => c.id !== commentId)
        }
        onCountChange(-1)
        return prev.map((top) =>
          top.id === parentId
            ? { ...top, replies: (top.replies ?? []).filter((r) => r.id !== commentId) }
            : top,
        )
      })
    })
  }

  function toggleExpanded(id: number) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="h-full w-full bg-[#1c1b1b] ghost-border flex flex-col">
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
        <h3 className="font-headline font-bold text-[#e5e2e1] tracking-tight">
          {reel.comments_count ?? 0} {reel.comments_count === 1 ? 'comment' : 'comments'}
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="text-stone-500 hover:text-stone-300 cursor-pointer"
          aria-label="Close comments"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {comments === null ? (
          <p className="text-stone-500 text-sm text-center py-8">Loading...</p>
        ) : comments.length === 0 ? (
          <p className="text-stone-500 text-sm text-center py-8">
            {error || 'No comments yet. Be the first.'}
          </p>
        ) : (
          comments.map((c) => (
            <CommentRow
              key={c.id}
              comment={c}
              currentUser={currentUser}
              isReplying={replyingTo === c.id}
              isExpanded={expanded.has(c.id)}
              onReplyClick={() => setReplyingTo((prev) => (prev === c.id ? null : c.id))}
              onCancelReply={() => setReplyingTo(null)}
              onSubmitReply={(text) => submitReply(c.id, text)}
              onToggleExpanded={() => toggleExpanded(c.id)}
              onDestroy={destroy}
            />
          ))
        )}
      </div>

      {currentUser ? (
        <form onSubmit={submit} className="flex gap-2 p-4 border-t border-white/5">
          <input
            type="text"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={1000}
            placeholder="Add a comment..."
            className="flex-1 bg-[#0e0e0e] border-none px-4 py-2 text-[#e5e2e1] text-sm focus:ring-1 focus:ring-[#ee671c]/30 placeholder:text-stone-600"
          />
          <button
            type="submit"
            disabled={!body.trim() || submitting}
            className="signature-smolder text-[#4c1a00] px-4 py-2 text-xs font-bold uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Post
          </button>
        </form>
      ) : (
        <div className="px-5 py-4 border-t border-white/5 text-stone-500 text-xs text-center">
          <Link href="/signin" className="text-[#ffb595] hover:text-[#ee671c] font-bold">
            Sign in
          </Link>{' '}
          to comment.
        </div>
      )}
    </div>
  )
}

function CommentRow({
  comment,
  currentUser,
  isReplying,
  isExpanded,
  onReplyClick,
  onCancelReply,
  onSubmitReply,
  onToggleExpanded,
  onDestroy,
}: {
  comment: Comment
  currentUser: SharedProps['auth']['user']
  isReplying: boolean
  isExpanded: boolean
  onReplyClick: () => void
  onCancelReply: () => void
  onSubmitReply: (text: string) => Promise<void>
  onToggleExpanded: () => void
  onDestroy: (id: number, parentId: number | null) => void
}) {
  const replies = comment.replies ?? []
  return (
    <div>
      <CommentBody
        comment={comment}
        canReply={!!currentUser}
        canDestroy={comment.can_destroy}
        onReplyClick={onReplyClick}
        onDestroy={() => onDestroy(comment.id, null)}
      />
      {isReplying && currentUser && (
        <div className="ml-11 mt-2">
          <ReplyForm
            placeholder={`Reply to ${comment.user.display_name}…`}
            onCancel={onCancelReply}
            onSubmit={onSubmitReply}
          />
        </div>
      )}
      {replies.length > 0 && (
        <div className="ml-11 mt-2">
          <button
            type="button"
            onClick={onToggleExpanded}
            className="text-[10px] uppercase tracking-widest font-bold text-stone-500 hover:text-[#ffb595] inline-flex items-center gap-1 cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">{isExpanded ? 'expand_less' : 'expand_more'}</span>
            {isExpanded ? 'Hide' : 'View'} {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
          </button>
          {isExpanded && (
            <div className="mt-3 space-y-3 border-l border-white/10 pl-3">
              {replies.map((r) => (
                <CommentBody
                  key={r.id}
                  comment={r}
                  canReply={false}
                  canDestroy={r.can_destroy}
                  onReplyClick={() => {}}
                  onDestroy={() => onDestroy(r.id, comment.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function CommentBody({
  comment,
  canReply,
  canDestroy,
  onReplyClick,
  onDestroy,
}: {
  comment: Comment
  canReply: boolean
  canDestroy: boolean
  onReplyClick: () => void
  onDestroy: () => void
}) {
  return (
    <div className="flex gap-3">
      <Link href={`/users/${comment.user.id}`} className="shrink-0">
        <img src={comment.user.avatar} alt="" className="w-8 h-8 rounded-full border border-white/10" />
      </Link>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <Link
            href={`/users/${comment.user.id}`}
            className="text-sm font-headline font-bold text-[#e5e2e1] hover:text-[#ffb595] truncate"
          >
            {comment.user.display_name}
          </Link>
          <span className="text-[10px] text-stone-600">{new Date(comment.created_at).toLocaleDateString()}</span>
        </div>
        <p className="text-stone-300 text-sm whitespace-pre-wrap break-words">{comment.body}</p>
        {canReply && (
          <button
            type="button"
            onClick={onReplyClick}
            className="text-[10px] uppercase tracking-widest font-bold text-stone-500 hover:text-[#ffb595] mt-1 cursor-pointer"
          >
            Reply
          </button>
        )}
      </div>
      {canDestroy && (
        <button
          type="button"
          onClick={onDestroy}
          className="text-stone-600 hover:text-red-400 shrink-0 cursor-pointer"
          aria-label="Delete comment"
        >
          <span className="material-symbols-outlined text-base">delete</span>
        </button>
      )}
    </div>
  )
}

function ReplyForm({
  placeholder,
  onCancel,
  onSubmit,
}: {
  placeholder: string
  onCancel: () => void
  onSubmit: (text: string) => Promise<void>
}) {
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim() || submitting) return
    setSubmitting(true)
    onSubmit(text)
      .then(() => setText(''))
      .finally(() => setSubmitting(false))
  }

  return (
    <form onSubmit={submit} className="flex gap-2">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={1000}
        placeholder={placeholder}
        autoFocus
        className="flex-1 bg-[#0e0e0e] border-none px-3 py-1.5 text-[#e5e2e1] text-sm focus:ring-1 focus:ring-[#ee671c]/30 placeholder:text-stone-600"
      />
      <button
        type="button"
        onClick={onCancel}
        className="text-stone-500 hover:text-stone-300 text-[10px] uppercase tracking-widest font-bold cursor-pointer px-2"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={!text.trim() || submitting}
        className="signature-smolder text-[#4c1a00] px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Reply
      </button>
    </form>
  )
}

function VideoMedia({ reel, muted, onTogglePlay, paused }: {
  reel: Reel
  muted: boolean
  onTogglePlay: (paused: boolean) => void
  paused: boolean
}) {
  const ref = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    const v = ref.current
    if (!v) return
    v.play().catch(() => {})
    onTogglePlay(false)
  }, [])

  function handleClick() {
    const v = ref.current
    if (!v) return
    if (v.paused) {
      v.play().catch(() => {})
      onTogglePlay(false)
    } else {
      v.pause()
      onTogglePlay(true)
    }
  }

  return (
    <>
      <video
        ref={ref}
        src={reel.video_url ?? undefined}
        muted={muted}
        loop
        playsInline
        preload="metadata"
        onClick={handleClick}
        className="max-h-full max-w-full object-contain"
      />
      {paused && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="material-symbols-outlined text-white/80" style={{ fontSize: 96 }}>
            play_arrow
          </span>
        </div>
      )}
    </>
  )
}

function CarouselMedia({ reel }: { reel: Reel }) {
  const [idx, setIdx] = useState(0)
  const startX = useRef<number | null>(null)
  const total = reel.images.length

  function go(delta: number) {
    setIdx((i) => Math.min(Math.max(i + delta, 0), total - 1))
  }

  function onTouchStart(e: React.TouchEvent) {
    startX.current = e.touches[0].clientX
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (startX.current === null) return
    const delta = e.changedTouches[0].clientX - startX.current
    if (Math.abs(delta) > 40) go(delta > 0 ? -1 : 1)
    startX.current = null
  }

  if (total === 0) return null

  return (
    <div
      className="relative w-full h-full overflow-hidden select-none"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div
        className="flex h-full transition-transform duration-300 ease-out"
        style={{ transform: `translateX(-${idx * 100}%)` }}
      >
        {reel.images.map((img) => (
          <div key={img.id} className="w-full h-full shrink-0 flex items-center justify-center">
            <img
              src={img.url}
              alt=""
              loading="eager"
              decoding="async"
              className="max-h-full max-w-full object-contain"
            />
          </div>
        ))}
      </div>

      {idx > 0 && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); go(-1) }}
          className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 backdrop-blur items-center justify-center text-white active:scale-90 transition-transform cursor-pointer z-10"
          aria-label="Previous image"
        >
          <span className="material-symbols-outlined">chevron_left</span>
        </button>
      )}
      {idx < total - 1 && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); go(1) }}
          className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 backdrop-blur items-center justify-center text-white active:scale-90 transition-transform cursor-pointer z-10"
          aria-label="Next image"
        >
          <span className="material-symbols-outlined">chevron_right</span>
        </button>
      )}

      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-1 z-10">
        {reel.images.map((_, i) => (
          <span
            key={i}
            className={`h-1 rounded-full transition-all ${i === idx ? 'w-6 bg-white' : 'w-3 bg-white/40'}`}
          />
        ))}
      </div>
    </div>
  )
}

function SlideshowMedia({ reel, muted }: { reel: Reel; muted: boolean }) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [idx, setIdx] = useState(0)
  const total = reel.images.length

  useEffect(() => {
    const a = audioRef.current
    if (!a) return
    a.currentTime = 0
    a.muted = muted
    a.play().catch(() => {})
  }, [muted])

  useEffect(() => {
    if (total <= 1) return
    const a = audioRef.current
    const cycle = a && !isNaN(a.duration) && a.duration > 0 ? (a.duration / total) * 1000 : 3000
    const t = setInterval(() => setIdx((i) => (i + 1) % total), cycle)
    return () => clearInterval(t)
  }, [total, reel.audio_url])

  if (total === 0) return null

  return (
    <div className="relative w-full h-full">
      {reel.images.map((img, i) => (
        <img
          key={img.id}
          src={img.url}
          alt=""
          loading="eager"
          decoding="async"
          className="absolute inset-0 m-auto max-h-full max-w-full object-contain transition-opacity duration-500"
          style={{ opacity: i === idx ? 1 : 0 }}
        />
      ))}
      {reel.audio_url && <audio ref={audioRef} src={reel.audio_url} loop preload="auto" />}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-1 z-10">
        {reel.images.map((_, i) => (
          <span key={i} className={`h-1 rounded-full transition-all ${i === idx ? 'w-6 bg-white' : 'w-3 bg-white/40'}`} />
        ))}
      </div>
    </div>
  )
}

export default function ReelsShow({ reel }: { reel: Reel }) {
  const [muted, setMuted] = useState(false)
  const [paused, setPaused] = useState(false)
  const [kudoed, setKudoed] = useState(reel.kudoed)
  const [kudosCount, setKudosCount] = useState(reel.kudos_count ?? 0)
  const [viewsCount, setViewsCount] = useState(reel.views_count ?? 0)
  const [commentsCount, setCommentsCount] = useState(reel.comments_count ?? 0)
  const [commentsOpen, setCommentsOpen] = useState(false)

  useEffect(() => {
    if (viewRecorded) return
    const t = window.setTimeout(() => {
      viewRecorded = true
      setViewsCount((v) => v + 1)
      fetch(`/reels/${reel.id}/view`, {
        method: 'POST',
        headers: { 'X-CSRF-Token': csrfToken() },
        credentials: 'same-origin',
      }).catch(() => {})
    }, VIEW_THRESHOLD_MS)
    return () => window.clearTimeout(t)
  }, [reel.id])

  function toggleKudo(e: React.MouseEvent) {
    e.stopPropagation()
    const next = !kudoed
    setKudoed(next)
    setKudosCount((c) => c + (next ? 1 : -1))
    const url = `/reels/${reel.id}/kudo`
    if (next) {
      router.post(url, {}, { preserveScroll: true, preserveState: true, only: [] })
    } else {
      router.delete(url, { preserveScroll: true, preserveState: true, only: [] })
    }
  }

  function closeComments() {
    setCommentsOpen(false)
  }

  function bumpCommentCount(delta: number) {
    setCommentsCount((c) => Math.max(0, c + delta))
  }

  const title = reel.title ? `${reel.title} - Forge` : `Reel by ${reel.user.display_name} - Forge`

  return (
    <>
      <Head title={title} />
      <div className="flex h-[calc(100dvh-3.5rem)] md:h-[100dvh] bg-black">
        <div className="flex-1 min-w-0 h-full relative flex items-center justify-center bg-black overflow-hidden">
          {reel.kind === 'video' && (
            <VideoMedia reel={reel} muted={muted} paused={paused} onTogglePlay={setPaused} />
          )}
          {reel.kind === 'image_carousel' && <CarouselMedia reel={reel} />}
          {reel.kind === 'slideshow' && <SlideshowMedia reel={reel} muted={muted} />}

          <Link
            href="/reels"
            className="absolute top-4 left-4 w-10 h-10 rounded-full bg-black/50 backdrop-blur flex items-center justify-center text-white active:scale-90 transition-transform cursor-pointer z-10"
            aria-label="Back to reels"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>

          {(reel.kind === 'video' || (reel.kind === 'slideshow' && reel.audio_url)) && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setMuted((m) => !m)
              }}
              aria-label={muted ? 'Unmute' : 'Mute'}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 backdrop-blur flex items-center justify-center text-white active:scale-90 transition-transform cursor-pointer z-10"
            >
              <span className="material-symbols-outlined text-xl">{muted ? 'volume_off' : 'volume_up'}</span>
            </button>
          )}

          <div className="absolute right-3 bottom-32 md:bottom-16 flex flex-col gap-4 items-center z-10">
            <ActionButton
              icon="favorite"
              label={formatCount(kudosCount)}
              active={kudoed}
              onClick={toggleKudo}
              ariaLabel={kudoed ? 'Remove kudos' : 'Give kudos'}
            />
            <ActionButton
              icon="mode_comment"
              label={formatCount(commentsCount)}
              onClick={(e) => {
                e.stopPropagation()
                setCommentsOpen(true)
              }}
              ariaLabel="Open comments"
            />
          </div>

          <div className="absolute left-0 right-16 bottom-0 px-5 pb-8 pt-16 z-10 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none">
            <div className="pointer-events-auto">
              <div className="flex items-center gap-3 mb-3">
                <Link
                  href={`/users/${reel.user.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-2 w-fit"
                >
                  <img src={reel.user.avatar} alt="" className="w-8 h-8 rounded-full border border-white/30" />
                  <span className="text-white font-headline font-bold text-sm tracking-tight drop-shadow">
                    @{reel.user.display_name}
                  </span>
                </Link>
                <span className="flex items-center gap-1 text-white/80 text-xs drop-shadow">
                  <span className="material-symbols-outlined text-sm">visibility</span>
                  {formatCount(viewsCount)}
                </span>
              </div>
              {reel.title && (
                <p className="text-white text-base font-headline font-bold leading-snug drop-shadow break-words line-clamp-3 mb-3">
                  {reel.title}
                </p>
              )}
              <Link
                href={`/projects/${reel.project.id}`}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-2 bg-white/10 backdrop-blur hover:bg-white/20 text-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] transition-colors"
              >
                <span className="material-symbols-outlined text-sm">visibility</span>
                View project
              </Link>
            </div>
          </div>
        </div>

        <div
          className="hidden md:block shrink-0 h-full overflow-hidden transition-[width] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
          style={{ width: commentsOpen ? 400 : 0 }}
        >
          <div className="w-[400px] h-full">
            {commentsOpen && (
              <CommentsPanel
                reel={{ ...reel, comments_count: commentsCount }}
                onClose={closeComments}
                onCountChange={bumpCommentCount}
              />
            )}
          </div>
        </div>
      </div>

      <div
        className={`md:hidden fixed inset-0 z-50 flex items-end transition-colors duration-300 ${
          commentsOpen ? 'bg-black/60 pointer-events-auto' : 'bg-black/0 pointer-events-none'
        }`}
        onClick={closeComments}
      >
        <div
          className={`w-full h-[75dvh] transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
            commentsOpen ? 'translate-y-0' : 'translate-y-full'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {commentsOpen && (
            <CommentsPanel
              reel={{ ...reel, comments_count: commentsCount }}
              onClose={closeComments}
              onCountChange={bumpCommentCount}
            />
          )}
        </div>
      </div>
    </>
  )
}
