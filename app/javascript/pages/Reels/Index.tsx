import { Head, Link, router } from '@inertiajs/react'

interface ReelRow {
  id: number
  title: string | null
  kind: 'video' | 'image_carousel' | 'slideshow' | string
  video_url: string | null
  first_image_url: string | null
  created_at: string
  stats: { views: number; kudos: number; comments: number }
  payout: { lifetime: number; pending: number; target: number }
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

function thumb(reel: ReelRow): string | null {
  if (reel.kind === 'video') return null
  return reel.first_image_url
}

export default function ReelsIndex({ project, reels }: Props) {
  function destroy(id: number) {
    if (!confirm('Delete this reel? This cannot be undone.')) return
    router.delete(`/reels/${id}`)
  }

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
          <div className="flex items-end justify-between gap-4 mt-3">
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
              return (
                <div key={reel.id} className="bg-[#1c1b1b] ghost-border p-5 flex flex-col sm:flex-row gap-5">
                  <div className="w-full sm:w-32 h-32 bg-black flex items-center justify-center shrink-0 overflow-hidden">
                    {reel.kind === 'video' && reel.video_url ? (
                      <video src={reel.video_url} className="w-full h-full object-cover" muted preload="metadata" />
                    ) : t ? (
                      <img src={t} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="material-symbols-outlined text-3xl text-stone-600">image</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="min-w-0">
                        <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#ffb595]">
                          {KIND_LABEL[reel.kind] || reel.kind}
                        </span>
                        <p className="font-headline font-bold text-[#e5e2e1] tracking-tight text-base truncate mt-0.5">
                          {reel.title || 'Untitled reel'}
                        </p>
                        <p className="text-[10px] text-stone-600 uppercase tracking-widest mt-1">
                          Posted {reel.created_at}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mt-3 mb-3">
                      <Stat icon="visibility" label="Views" value={reel.stats.views} />
                      <Stat icon="favorite" label="Kudos" value={reel.stats.kudos} />
                      <Stat icon="mode_comment" label="Comments" value={reel.stats.comments} />
                    </div>

                    <div className="bg-[#0e0e0e] ghost-border p-3 text-xs flex flex-wrap items-center gap-x-5 gap-y-1">
                      <span className="text-stone-500">
                        Paid out: <span className="text-[#ffb595] font-bold">{reel.payout.lifetime.toFixed(2)}c</span>
                      </span>
                      {reel.payout.pending > 0 && (
                        <span className="text-stone-500">
                          Awaiting approval:{' '}
                          <span className="text-amber-300 font-bold">{reel.payout.pending.toFixed(2)}c</span>
                        </span>
                      )}
                      <span className="text-stone-500">
                        Current estimated payout:{' '}
                        <span className="text-[#e5e2e1] font-bold">{reel.payout.target.toFixed(2)}c</span>
                      </span>
                    </div>

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
                        onClick={() => destroy(reel.id)}
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
    </>
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
