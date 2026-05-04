import { useEffect, useState } from 'react'
import { Head, Link, router, usePage } from '@inertiajs/react'
import type { SharedProps } from '../../types'

interface Props {
  project: { id: number; name: string }
  reel: {
    id: number
    title: string
    kind: string
    video_url: string | null
    audio_url: string | null
    image_urls: string[]
    created_at: string
  }
}

const KIND_LABEL: Record<string, string> = {
  video: 'Video',
  image_carousel: 'Carousel',
  slideshow: 'Slideshow',
}

export default function ReelsEdit({ project, reel }: Props) {
  const page = usePage<SharedProps>()
  const [title, setTitle] = useState(reel.title)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const alert = page.props.flash?.alert
    if (alert) setError(alert)
  }, [page.props.flash])

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    router.patch(
      `/reels/${reel.id}`,
      { title },
      {
        preserveScroll: true,
        onError: (errs) => setError(Object.values(errs).flat().join(', ')),
        onFinish: () => setSubmitting(false),
      },
    )
  }

  const dirty = title !== reel.title

  return (
    <>
      <Head title={`Edit reel — ${project.name}`} />
      <div className="p-5 md:p-12 max-w-2xl mx-auto">
        <Link
          href={`/projects/${project.id}/reels`}
          className="text-stone-500 hover:text-[#ffb595] text-xs uppercase tracking-[0.2em] font-bold inline-flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Manage reels
        </Link>
        <div className="flex items-end justify-between gap-3 mt-3 mb-6 flex-wrap">
          <div>
            <h1 className="text-3xl font-headline font-bold tracking-tight text-[#e5e2e1]">Edit reel</h1>
            <p className="text-stone-500 text-xs uppercase tracking-widest font-bold mt-1">
              {KIND_LABEL[reel.kind] || reel.kind} · Posted {reel.created_at}
            </p>
          </div>
        </div>

        <div className="bg-[#1c1b1b] ghost-border p-5 mb-6">
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-500 mb-3">Current media</p>
          {reel.kind === 'video' && reel.video_url && (
            <video src={reel.video_url} controls playsInline className="w-full max-h-[60vh] bg-black" />
          )}
          {reel.kind === 'image_carousel' && reel.image_urls.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {reel.image_urls.map((src, idx) => (
                <div key={idx} className="relative">
                  <img src={src} alt="" className="w-full aspect-square object-cover" />
                  <span className="absolute top-1 left-1 text-[10px] bg-black/70 text-white px-1.5 py-0.5 font-bold">
                    {idx + 1}
                  </span>
                </div>
              ))}
            </div>
          )}
          {reel.kind === 'slideshow' && (
            <>
              {reel.image_urls.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-3">
                  {reel.image_urls.map((src, idx) => (
                    <img key={idx} src={src} alt="" className="w-full aspect-square object-cover" />
                  ))}
                </div>
              )}
              {reel.audio_url && <audio src={reel.audio_url} controls className="w-full" />}
            </>
          )}
        </div>

        <form onSubmit={submit} className="space-y-6">
          <div className="bg-[#1c1b1b] ghost-border p-6">
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-500 mb-3">Title</p>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              placeholder="A short title for your reel..."
              className="w-full bg-[#0e0e0e] border-none px-4 py-3 text-[#e5e2e1] text-sm focus:ring-1 focus:ring-[#ee671c]/30 placeholder:text-stone-600"
              autoFocus
            />
            <p className="text-[10px] text-stone-600 text-right mt-1">{title.length} / 200</p>
            <p className="text-[10px] text-stone-600 mt-3">
              Media (video / images / audio) can't be swapped after publishing — delete and repost if you need to change
              it.
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 px-4 py-3 text-red-300 text-sm">{error}</div>
          )}

          <div className="flex gap-3">
            <Link
              href={`/projects/${project.id}/reels`}
              className="ghost-border bg-[#1c1b1b] hover:bg-[#2a2a2a] text-stone-400 hover:text-[#ffb595] px-4 py-2.5 uppercase tracking-wider text-[10px] font-bold flex items-center gap-2"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting || !dirty}
              className="signature-smolder text-[#4c1a00] px-6 py-2.5 font-bold uppercase tracking-wider text-xs flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {submitting ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
