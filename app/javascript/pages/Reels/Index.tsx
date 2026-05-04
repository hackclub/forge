import { useEffect, useState } from 'react'
import { Head, Link, router } from '@inertiajs/react'

interface ReelRow {
  id: number
  title: string | null
  kind: 'video' | 'image_carousel' | 'slideshow' | string
  video_url: string | null
  first_image_url: string | null
  created_at: string
  stats: { views: number; kudos: number; comments: number }
  payout: { lifetime: number; pending: number; target: number; max: number }
}

interface Props {
  project: { id: number; name: string }
  reels: ReelRow[]
}

const KIND_LABEL: Record<string, string> = {
  video: 'Video',
  image_carousel: 'Carousel',
  slideshow: 'Slideshow',
}

const KIND_ICON: Record<string, string> = {
  video: 'videocam',
  image_carousel: 'collections',
  slideshow: 'slideshow',
}

function thumb(reel: ReelRow): string | null {
  if (reel.kind === 'video') return null
  return reel.first_image_url
}

export default function ReelsIndex({ project, reels }: Props) {
  const [previewing, setPreviewing] = useState<ReelRow | null>(null)
  const [deleting, setDeleting] = useState<ReelRow | null>(null)

  useEffect(() => {
    if (!previewing && !deleting) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setPreviewing(null)
        setDeleting(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [previewing, deleting])

  function confirmDelete() {
    if (!deleting) return
    router.delete(`/reels/${deleting.id}`, { onFinish: () => setDeleting(null) })
  }

  const totals = reels.reduce(
    (acc, r) => ({
      views: acc.views + r.stats.views,
      kudos: acc.kudos + r.stats.kudos,
      comments: acc.comments + r.stats.comments,
      paid: acc.paid + r.payout.lifetime,
    }),
    { views: 0, kudos: 0, comments: 0, paid: 0 },
  )

  return (
    <>
      <Head title={`Reels — ${project.name}`} />
      <div className="p-5 md:p-12 max-w-5xl mx-auto">
        <div className="mb-8">
          <Link
            href={`/projects/${project.id}`}
            className="text-stone-500 hover:text-[#ffb595] text-xs uppercase tracking-[0.2em] font-bold inline-flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            {project.name}
          </Link>
          <div className="flex items-end justify-between gap-4 mt-3 flex-wrap">
            <div>
              <h1 className="text-3xl sm:text-4xl font-headline font-bold tracking-tight text-[#e5e2e1]">
                Manage Reels
              </h1>
              <p className="text-stone-500 text-sm mt-1">
                {reels.length} {reels.length === 1 ? 'reel' : 'reels'} for this project.
              </p>
            </div>
            <Link
              href={`/projects/${project.id}/reels/new`}
              className="signature-smolder text-[#4c1a00] px-4 py-2 font-bold uppercase tracking-wider text-xs flex items-center gap-2 shrink-0"
            >
              <span className="material-symbols-outlined text-base">add</span>
              New Reel
            </Link>
          </div>
        </div>

        {reels.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            <SummaryCard icon="visibility" label="Total views" value={totals.views.toLocaleString()} />
            <SummaryCard icon="favorite" label="Total kudos" value={totals.kudos.toLocaleString()} />
            <SummaryCard icon="mode_comment" label="Total comments" value={totals.comments.toLocaleString()} />
            <SummaryCard icon="paid" label="Paid out" value={`${totals.paid.toFixed(2)}c`} />
          </div>
        )}

        {reels.length === 0 ? (
          <div className="bg-[#1c1b1b] ghost-border p-16 text-center">
            <span className="material-symbols-outlined text-5xl text-[#ee671c] mb-4 block">play_circle</span>
            <p className="text-stone-300 text-lg font-headline font-medium mb-2">No reels yet</p>
            <p className="text-stone-500 text-sm mb-6">Post a reel to share progress on this project.</p>
            <Link
              href={`/projects/${project.id}/reels/new`}
              className="signature-smolder text-[#4c1a00] px-6 py-3 font-headline font-bold uppercase tracking-wider text-xs inline-flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">add</span>
              Create your first reel
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {reels.map((reel) => {
              const t = thumb(reel)
              const playable = (reel.kind === 'video' && reel.video_url) || (reel.kind !== 'video' && t)
              return (
                <div key={reel.id} className="bg-[#1c1b1b] ghost-border p-5 flex flex-col sm:flex-row gap-5">
                  <button
                    type="button"
                    onClick={() => playable && setPreviewing(reel)}
                    className={`relative w-full sm:w-40 h-40 sm:h-32 bg-black flex items-center justify-center shrink-0 overflow-hidden group ${
                      playable ? 'cursor-pointer' : 'cursor-default'
                    }`}
                    aria-label={playable ? 'Preview reel' : 'No preview'}
                    disabled={!playable}
                  >
                    {reel.kind === 'video' && reel.video_url ? (
                      <video src={reel.video_url} className="w-full h-full object-cover" muted preload="metadata" />
                    ) : t ? (
                      <img src={t} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="material-symbols-outlined text-3xl text-stone-600">image</span>
                    )}
                    {playable && (
                      <span className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-colors">
                        <span className="material-symbols-outlined text-5xl text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg">
                          play_circle
                        </span>
                      </span>
                    )}
                    <span className="absolute top-1 left-1 bg-black/70 text-white px-1.5 py-0.5 text-[9px] uppercase tracking-widest font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">{KIND_ICON[reel.kind] || 'play_circle'}</span>
                      {KIND_LABEL[reel.kind] || reel.kind}
                    </span>
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="min-w-0 mb-2">
                      <p className="font-headline font-bold text-[#e5e2e1] tracking-tight text-base truncate">
                        {reel.title || 'Untitled reel'}
                      </p>
                      <p className="text-[10px] text-stone-600 uppercase tracking-widest mt-1">Posted {reel.created_at}</p>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-3 mb-3">
                      <Stat icon="visibility" label="Views" value={reel.stats.views} />
                      <Stat icon="favorite" label="Kudos" value={reel.stats.kudos} />
                      <Stat icon="mode_comment" label="Comments" value={reel.stats.comments} />
                    </div>

                    <PayoutBar payout={reel.payout} />

                    <div className="flex gap-2 mt-3">
                      <Link
                        href={`/reels/${reel.id}/edit`}
                        className="ghost-border bg-[#0e0e0e] hover:bg-[#2a2a2a] text-stone-400 hover:text-[#ffb595] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm">edit</span>
                        Edit
                      </Link>
                      <button
                        type="button"
                        onClick={() => setDeleting(reel)}
                        className="ghost-border bg-[#0e0e0e] hover:bg-red-500/20 text-stone-400 hover:text-red-300 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {previewing && <PreviewModal reel={previewing} onClose={() => setPreviewing(null)} />}
      {deleting && <DeleteModal reel={deleting} onCancel={() => setDeleting(null)} onConfirm={confirmDelete} />}
    </>
  )
}

function SummaryCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="bg-[#1c1b1b] ghost-border p-4">
      <div className="flex items-center gap-2 mb-1">
        <span className="material-symbols-outlined text-base text-[#ee671c]">{icon}</span>
        <span className="text-[10px] uppercase tracking-widest font-bold text-stone-500">{label}</span>
      </div>
      <p className="text-[#e5e2e1] font-headline font-bold tabular-nums text-2xl">{value}</p>
    </div>
  )
}

function Stat({ icon, label, value }: { icon: string; label: string; value: number }) {
  return (
    <div className="bg-[#0e0e0e] ghost-border px-3 py-2 flex items-center gap-2">
      <span className="material-symbols-outlined text-base text-[#ee671c]">{icon}</span>
      <div className="min-w-0">
        <p className="text-[9px] uppercase tracking-widest font-bold text-stone-500">{label}</p>
        <p className="text-[#e5e2e1] font-headline font-bold tabular-nums">{value}</p>
      </div>
    </div>
  )
}

function PayoutBar({ payout }: { payout: ReelRow['payout'] }) {
  const lifetimePct = Math.min(100, (payout.lifetime / payout.max) * 100)
  const pendingPct = Math.min(100 - lifetimePct, (payout.pending / payout.max) * 100)
  return (
    <div className="bg-[#0e0e0e] ghost-border p-3">
      <div className="flex items-center justify-between text-xs mb-2">
        <span className="text-stone-500">
          Paid <span className="text-[#ffb595] font-bold">{payout.lifetime.toFixed(2)}c</span>
          {payout.pending > 0 && (
            <>
              {' · '}
              <span className="text-amber-300 font-bold">+{payout.pending.toFixed(2)}c pending</span>
            </>
          )}
        </span>
        <span className="text-stone-600 text-[10px] uppercase tracking-widest">
          Cap {payout.max}c
        </span>
      </div>
      <div className="h-1.5 bg-stone-800 overflow-hidden flex">
        <div className="signature-smolder h-full" style={{ width: `${lifetimePct}%` }} />
        <div className="bg-amber-400/60 h-full" style={{ width: `${pendingPct}%` }} />
      </div>
      <p className="text-[10px] text-stone-600 mt-2">
        Estimated next payout: <span className="text-[#e5e2e1] font-bold">{payout.target.toFixed(2)}c</span>
      </p>
    </div>
  )
}

function PreviewModal({ reel, onClose }: { reel: ReelRow; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative bg-[#1c1b1b] ghost-border max-w-3xl w-full max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-9 h-9 bg-black/70 hover:bg-black text-white flex items-center justify-center cursor-pointer"
          aria-label="Close"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
        <div className="p-4">
          {reel.kind === 'video' && reel.video_url && (
            <video src={reel.video_url} controls autoPlay playsInline className="w-full max-h-[75vh] bg-black" />
          )}
          {reel.kind !== 'video' && reel.first_image_url && (
            <img src={reel.first_image_url} alt={reel.title || ''} className="w-full max-h-[75vh] object-contain bg-black" />
          )}
          <p className="text-[#e5e2e1] font-headline font-bold mt-3">{reel.title || 'Untitled reel'}</p>
          <p className="text-stone-500 text-xs mt-1">Posted {reel.created_at}</p>
        </div>
      </div>
    </div>
  )
}

function DeleteModal({
  reel,
  onCancel,
  onConfirm,
}: {
  reel: ReelRow
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div
        className="bg-[#1c1b1b] ghost-border max-w-md w-full p-6 border border-red-500/20"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 mb-4">
          <span className="material-symbols-outlined text-red-400 text-2xl">warning</span>
          <div>
            <p className="font-headline font-bold text-[#e5e2e1] text-lg">Delete this reel?</p>
            <p className="text-stone-500 text-sm mt-1 break-all">"{reel.title || 'Untitled reel'}"</p>
          </div>
        </div>
        <p className="text-stone-400 text-sm mb-6">
          This permanently removes the reel along with its views, kudos, and comments. Past payouts are kept for the
          record. Can't be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="ghost-border bg-[#0e0e0e] hover:bg-[#2a2a2a] text-stone-400 hover:text-[#ffb595] px-4 py-2 uppercase tracking-wider text-[10px] font-bold cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-200 px-4 py-2 uppercase tracking-wider text-[10px] font-bold cursor-pointer"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}
