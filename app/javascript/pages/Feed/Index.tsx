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

interface Ad {
  is_ad: true
  id: number
  title: string
  video_url: string
  click_url: string | null
  duration_seconds: number | null
}

type FeedItem = Reel | Ad

function isAd(item: FeedItem): item is Ad {
  return (item as Ad).is_ad === true
}

const VIEW_THRESHOLD_MS = 2000
const viewedReelIds = new Set<number>()
const seenAdIds = new Set<number>()

interface Comment {
  id: number
  body: string
  created_at: string
  can_destroy: boolean
  user: { id: number; display_name: string; avatar: string }
}

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

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!body.trim() || submitting) return
    setSubmitting(true)
    setError(null)
    fetch(`/reels/${reel.id}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-CSRF-Token': csrfToken(),
      },
      credentials: 'same-origin',
      body: JSON.stringify({ body }),
    })
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((data) => {
        if (data.comment) {
          setComments((prev) => (prev ? [data.comment, ...prev] : [data.comment]))
          setBody('')
          onCountChange(1)
        }
      })
      .catch((e) => setError(`Failed to post (${e.message})`))
      .finally(() => setSubmitting(false))
  }

  function destroy(commentId: number) {
    fetch(`/reels/${reel.id}/comments/${commentId}`, {
      method: 'DELETE',
      headers: { 'X-CSRF-Token': csrfToken() },
      credentials: 'same-origin',
    }).then((r) => {
      if (r.ok) {
        setComments((prev) => (prev ? prev.filter((c) => c.id !== commentId) : prev))
        onCountChange(-1)
      }
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
            <div key={c.id} className="flex gap-3">
              <Link href={`/users/${c.user.id}`} className="shrink-0">
                <img src={c.user.avatar} alt="" className="w-8 h-8 rounded-full border border-white/10" />
              </Link>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <Link
                    href={`/users/${c.user.id}`}
                    className="text-sm font-headline font-bold text-[#e5e2e1] hover:text-[#ffb595] truncate"
                  >
                    {c.user.display_name}
                  </Link>
                  <span className="text-[10px] text-stone-600">{new Date(c.created_at).toLocaleDateString()}</span>
                </div>
                <p className="text-stone-300 text-sm whitespace-pre-wrap break-words">{c.body}</p>
              </div>
              {c.can_destroy && (
                <button
                  type="button"
                  onClick={() => destroy(c.id)}
                  className="text-stone-600 hover:text-red-400 shrink-0 cursor-pointer"
                  aria-label="Delete comment"
                >
                  <span className="material-symbols-outlined text-base">delete</span>
                </button>
              )}
            </div>
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

function VideoMedia({ reel, isActive, muted, onTogglePlay, paused }: {
  reel: Reel
  isActive: boolean
  muted: boolean
  onTogglePlay: (paused: boolean) => void
  paused: boolean
}) {
  const ref = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    const v = ref.current
    if (!v) return
    if (isActive) {
      v.currentTime = 0
      v.play().catch(() => {})
      onTogglePlay(false)
    } else {
      v.pause()
    }
  }, [isActive])

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

function SlideshowMedia({ reel, isActive, muted }: { reel: Reel; isActive: boolean; muted: boolean }) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [idx, setIdx] = useState(0)
  const total = reel.images.length

  useEffect(() => {
    const a = audioRef.current
    if (!a) return
    if (isActive) {
      a.currentTime = 0
      a.muted = muted
      a.play().catch(() => {})
    } else {
      a.pause()
    }
  }, [isActive, muted])

  useEffect(() => {
    if (!isActive || total <= 1) return
    const a = audioRef.current
    const cycle = a && !isNaN(a.duration) && a.duration > 0 ? (a.duration / total) * 1000 : 3000
    const t = setInterval(() => setIdx((i) => (i + 1) % total), cycle)
    return () => clearInterval(t)
  }, [isActive, total, reel.audio_url])

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

function ReelCard({
  reel,
  isActive,
  onOpenComments,
}: {
  reel: Reel
  isActive: boolean
  onOpenComments: (reel: Reel) => void
}) {
  const [muted, setMuted] = useState(true)
  const [paused, setPaused] = useState(false)
  const [kudoed, setKudoed] = useState(reel.kudoed)
  const [viewsCount, setViewsCount] = useState(reel.views_count ?? 0)

  useEffect(() => {
    if (!isActive) return
    if (viewedReelIds.has(reel.id)) return
    const t = window.setTimeout(() => {
      viewedReelIds.add(reel.id)
      setViewsCount((v) => v + 1)
      fetch(`/reels/${reel.id}/view`, {
        method: 'POST',
        headers: { 'X-CSRF-Token': csrfToken() },
        credentials: 'same-origin',
      }).catch(() => {})
    }, VIEW_THRESHOLD_MS)
    return () => window.clearTimeout(t)
  }, [isActive, reel.id])
  const [kudosCount, setKudosCount] = useState(reel.kudos_count ?? 0)

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

  return (
    <section className="snap-start h-[calc(100dvh-3.5rem)] md:h-[100dvh] w-full relative flex items-center justify-center bg-black overflow-hidden">
      {reel.kind === 'video' && (
        <VideoMedia reel={reel} isActive={isActive} muted={muted} paused={paused} onTogglePlay={setPaused} />
      )}
      {reel.kind === 'image_carousel' && <CarouselMedia reel={reel} />}
      {reel.kind === 'slideshow' && <SlideshowMedia reel={reel} isActive={isActive} muted={muted} />}

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
          label={formatCount(reel.comments_count ?? 0)}
          onClick={(e) => {
            e.stopPropagation()
            onOpenComments(reel)
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
    </section>
  )
}

function AdCard({ ad, isActive }: { ad: Ad; isActive: boolean }) {
  const ref = useRef<HTMLVideoElement | null>(null)
  const [muted, setMuted] = useState(true)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    const v = ref.current
    if (!v) return
    if (isActive) {
      v.currentTime = 0
      v.play().catch(() => {})
      setPaused(false)
    } else {
      v.pause()
    }
  }, [isActive])

  useEffect(() => {
    if (!isActive) return
    if (seenAdIds.has(ad.id)) return
    seenAdIds.add(ad.id)
    fetch(`/reel_ads/${ad.id}/impression`, {
      method: 'POST',
      headers: { 'X-CSRF-Token': csrfToken() },
      credentials: 'same-origin',
    }).catch(() => {})
  }, [isActive, ad.id])

  function handleClick() {
    const v = ref.current
    if (!v) return
    if (v.paused) {
      v.play().catch(() => {})
      setPaused(false)
    } else {
      v.pause()
      setPaused(true)
    }
  }

  function trackClick() {
    fetch(`/reel_ads/${ad.id}/click`, {
      method: 'POST',
      headers: { 'X-CSRF-Token': csrfToken() },
      credentials: 'same-origin',
    }).catch(() => {})
  }

  return (
    <section className="snap-start h-[calc(100dvh-3.5rem)] md:h-[100dvh] w-full relative flex items-center justify-center bg-black overflow-hidden">
      <video
        ref={ref}
        src={ad.video_url}
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

      <div className="absolute top-4 left-4 z-10 bg-white/15 backdrop-blur px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white">
        Sponsored
      </div>

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

      <div className="absolute left-0 right-0 bottom-0 px-5 pb-8 pt-16 z-10 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none">
        <div className="pointer-events-auto">
          <p className="text-white text-base font-headline font-bold leading-snug drop-shadow break-words line-clamp-3 mb-3">
            {ad.title}
          </p>
          {ad.click_url && (
            <a
              href={ad.click_url}
              target="_blank"
              rel="noopener noreferrer sponsored"
              onClick={(e) => {
                e.stopPropagation()
                trackClick()
              }}
              className="inline-flex items-center gap-2 signature-smolder text-[#4c1a00] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.15em]"
            >
              <span className="material-symbols-outlined text-sm">open_in_new</span>
              Learn more
            </a>
          )}
        </div>
      </div>
    </section>
  )
}

function feedKey(item: FeedItem): string {
  return isAd(item) ? `a-${item.id}` : `r-${item.id}`
}

export default function FeedIndex({ reels }: { reels: FeedItem[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [activeKey, setActiveKey] = useState<string | null>(reels[0] ? feedKey(reels[0]) : null)
  const [activeCommentsReel, setActiveCommentsReel] = useState<Reel | null>(null)
  const [commentsCounts, setCommentsCounts] = useState<Record<number, number>>(
    () =>
      Object.fromEntries(
        reels.filter((r): r is Reel => !isAd(r)).map((r) => [r.id, r.comments_count ?? 0]),
      ),
  )

  useEffect(() => {
    const root = containerRef.current
    if (!root) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            const key = (entry.target as HTMLElement).dataset.feedKey
            if (key) setActiveKey(key)
          }
        })
      },
      { root, threshold: [0, 0.6, 1] },
    )

    root.querySelectorAll<HTMLElement>('[data-feed-key]').forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [reels.length])

  const [commentsOpen, setCommentsOpen] = useState(false)

  function openComments(reel: Reel) {
    setActiveCommentsReel(reel)
    requestAnimationFrame(() => setCommentsOpen(true))
  }

  function closeComments() {
    setCommentsOpen(false)
    window.setTimeout(() => setActiveCommentsReel(null), 320)
  }

  function bumpCommentCount(reelId: number, delta: number) {
    setCommentsCounts((prev) => ({ ...prev, [reelId]: Math.max(0, (prev[reelId] ?? 0) + delta) }))
  }

  const itemsWithCounts: FeedItem[] = reels.map((item) =>
    isAd(item) ? item : { ...item, comments_count: commentsCounts[item.id] ?? item.comments_count ?? 0 },
  )

  return (
    <>
      <Head title="Feed - Forge" />
      <div className="flex h-[calc(100dvh-3.5rem)] md:h-[100dvh] bg-black">
        <div
          ref={containerRef}
          data-feed-scroller
          className="flex-1 min-w-0 h-full overflow-y-auto snap-y snap-mandatory bg-black"
          style={{ scrollbarWidth: 'none', scrollBehavior: 'smooth', overscrollBehavior: 'contain' }}
        >
          <style>{`
            [data-feed-scroller]::-webkit-scrollbar { display: none; }
            [data-feed-key] { transition: transform 350ms cubic-bezier(0.32, 0.72, 0, 1), opacity 350ms cubic-bezier(0.32, 0.72, 0, 1); }
            [data-feed-key]:not([data-active="true"]) { transform: scale(0.96); opacity: 0.55; }
          `}</style>
          {reels.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-8 text-stone-400">
              <span className="material-symbols-outlined text-6xl text-[#ee671c] mb-4">play_circle</span>
              <h2 className="text-2xl font-headline font-bold text-[#e5e2e1] mb-2">No reels yet</h2>
              <p className="text-stone-500 text-sm mb-6">Open a project and tap "Reels" to post the first one.</p>
              <Link
                href="/explore"
                className="signature-smolder text-[#4c1a00] px-5 py-2.5 font-bold uppercase tracking-wider text-xs"
              >
                Browse projects
              </Link>
            </div>
          ) : (
            itemsWithCounts.map((item) => {
              const key = feedKey(item)
              const active = activeKey === key
              return (
                <div key={key} data-feed-key={key} data-active={active ? 'true' : 'false'}>
                  {isAd(item) ? (
                    <AdCard ad={item} isActive={active} />
                  ) : (
                    <ReelCard reel={item} isActive={active} onOpenComments={openComments} />
                  )}
                </div>
              )
            })
          )}
        </div>

        <div
          className="hidden md:block shrink-0 h-full overflow-hidden transition-[width] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
          style={{ width: commentsOpen ? 400 : 0 }}
        >
          <div className="w-[400px] h-full">
            {activeCommentsReel && (
              <CommentsPanel
                reel={activeCommentsReel}
                onClose={closeComments}
                onCountChange={(delta) => bumpCommentCount(activeCommentsReel.id, delta)}
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
          {activeCommentsReel && (
            <CommentsPanel
              reel={activeCommentsReel}
              onClose={closeComments}
              onCountChange={(delta) => bumpCommentCount(activeCommentsReel.id, delta)}
            />
          )}
        </div>
      </div>
    </>
  )
}
