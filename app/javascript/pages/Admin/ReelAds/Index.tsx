import { useState } from 'react'
import { Head, Link, router } from '@inertiajs/react'

interface ReelAd {
  id: number
  title: string
  video_url: string
  click_url: string | null
  duration_seconds: number | null
  enabled: boolean
  impressions_count: number
  clicks_count: number
  ctr: number
  created_at: string
}

interface Props {
  ads: ReelAd[]
  max_video_mb: number
}

export default function AdminReelAdsIndex({ ads, max_video_mb }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [clickUrl, setClickUrl] = useState('')
  const [enabled, setEnabled] = useState(true)
  const [video, setVideo] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function reset() {
    setTitle('')
    setClickUrl('')
    setEnabled(true)
    setVideo(null)
    setShowForm(false)
    setError(null)
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!video) {
      setError('Pick a video file.')
      return
    }
    if (video.size > max_video_mb * 1024 * 1024) {
      setError(`Video must be ${max_video_mb} MB or smaller.`)
      return
    }
    setSubmitting(true)
    setError(null)

    const fd = new FormData()
    fd.append('title', title)
    fd.append('click_url', clickUrl)
    fd.append('enabled', enabled ? 'true' : 'false')
    fd.append('video', video)
    const v = document.createElement('video')
    v.preload = 'metadata'
    v.onloadedmetadata = () => {
      if (!isNaN(v.duration) && v.duration > 0) {
        fd.append('duration_seconds', String(Math.round(v.duration)))
      }
      router.post('/admin/reel_ads', fd, {
        forceFormData: true,
        onSuccess: reset,
        onError: (errs) => setError(Object.values(errs).join(', ')),
        onFinish: () => setSubmitting(false),
      })
    }
    v.onerror = () => {
      router.post('/admin/reel_ads', fd, {
        forceFormData: true,
        onSuccess: reset,
        onError: (errs) => setError(Object.values(errs).join(', ')),
        onFinish: () => setSubmitting(false),
      })
    }
    v.src = URL.createObjectURL(video)
  }

  function toggle(id: number) {
    router.post(`/admin/reel_ads/${id}/toggle`)
  }

  function destroy(id: number, t: string) {
    if (!confirm(`Delete ad "${t}"?`)) return
    router.delete(`/admin/reel_ads/${id}`)
  }

  function saveEdit(ad: ReelAd, fields: { title: string; click_url: string }) {
    router.patch(`/admin/reel_ads/${ad.id}`, { title: fields.title, click_url: fields.click_url })
  }

  return (
    <>
      <Head title="Reel Ads — Admin" />
      <div className="p-5 md:p-12 max-w-6xl mx-auto">
        <Link
          href="/admin"
          className="ghost-border inline-block px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-stone-500 hover:text-[#e5e2e1] transition-colors mb-6"
        >
          ← Admin
        </Link>

        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl sm:text-4xl font-headline font-bold tracking-tight text-[#e5e2e1]">Reel Ads</h1>
          <button
            type="button"
            onClick={() => (showForm ? reset() : setShowForm(true))}
            className="signature-smolder text-[#4c1a00] px-6 py-3 font-bold uppercase tracking-wider text-xs flex items-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">{showForm ? 'close' : 'add'}</span>
            {showForm ? 'Cancel' : 'New Ad'}
          </button>
        </div>
        <p className="text-stone-500 text-sm mb-8">
          Video ads are randomly mixed into the reels feed every few items.
        </p>

        {showForm && (
          <form onSubmit={submit} className="ghost-border bg-[#1c1b1b] p-6 mb-8 space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-[0.2em] text-stone-500 mb-2">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                maxLength={200}
                className="w-full bg-[#0e0e0e] border-none px-4 py-3 text-[#e5e2e1] focus:ring-1 focus:ring-[#ee671c]/30 placeholder:text-stone-600 text-sm"
                placeholder="Sponsor Co. — buy our soldering iron"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-[0.2em] text-stone-500 mb-2">Click URL (optional)</label>
              <input
                type="url"
                value={clickUrl}
                onChange={(e) => setClickUrl(e.target.value)}
                className="w-full bg-[#0e0e0e] border-none px-4 py-3 text-[#e5e2e1] focus:ring-1 focus:ring-[#ee671c]/30 placeholder:text-stone-600 text-sm"
                placeholder="https://example.com"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-[0.2em] text-stone-500 mb-2">
                Video (≤ {max_video_mb} MB)
              </label>
              <input
                type="file"
                accept="video/*"
                onChange={(e) => setVideo(e.target.files?.[0] ?? null)}
                required
                className="w-full text-stone-300 text-sm file:mr-3 file:py-2 file:px-4 file:border-0 file:bg-[#0e0e0e] file:text-stone-300 file:text-xs file:font-bold file:uppercase file:tracking-wider file:cursor-pointer"
              />
            </div>
            <label className="flex items-center gap-3 text-sm text-stone-400 cursor-pointer">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="accent-[#ee671c]"
              />
              Enable immediately
            </label>
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="signature-smolder text-[#4c1a00] px-6 py-3 font-bold uppercase tracking-wider text-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submitting ? 'Uploading…' : 'Create'}
              </button>
              <button
                type="button"
                onClick={reset}
                className="ghost-border text-stone-400 px-6 py-3 text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {ads.length === 0 ? (
          <div className="ghost-border bg-[#1c1b1b] p-16 text-center">
            <p className="text-stone-300 text-lg font-headline font-medium mb-2">No ads yet</p>
            <p className="text-stone-500 text-sm">Create one to start serving ads in the reels feed.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {ads.map((ad) => (
              <AdRow key={ad.id} ad={ad} onToggle={toggle} onDestroy={destroy} onSave={saveEdit} />
            ))}
          </div>
        )}
      </div>
    </>
  )
}

function AdRow({
  ad,
  onToggle,
  onDestroy,
  onSave,
}: {
  ad: ReelAd
  onToggle: (id: number) => void
  onDestroy: (id: number, title: string) => void
  onSave: (ad: ReelAd, fields: { title: string; click_url: string }) => void
}) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(ad.title)
  const [clickUrl, setClickUrl] = useState(ad.click_url ?? '')

  return (
    <div className="bg-[#1c1b1b] ghost-border p-5 flex flex-col md:flex-row gap-4">
      <video
        src={ad.video_url}
        muted
        loop
        playsInline
        preload="metadata"
        className="w-full md:w-40 aspect-[9/16] object-cover bg-black shrink-0"
        onMouseEnter={(e) => e.currentTarget.play().catch(() => {})}
        onMouseLeave={(e) => e.currentTarget.pause()}
      />
      <div className="flex-1 min-w-0">
        {editing ? (
          <div className="space-y-2">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#0e0e0e] border-none px-3 py-2 text-[#e5e2e1] text-sm focus:ring-1 focus:ring-[#ee671c]/30"
            />
            <input
              type="url"
              value={clickUrl}
              onChange={(e) => setClickUrl(e.target.value)}
              placeholder="https://..."
              className="w-full bg-[#0e0e0e] border-none px-3 py-2 text-[#e5e2e1] text-sm focus:ring-1 focus:ring-[#ee671c]/30"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  onSave(ad, { title, click_url: clickUrl })
                  setEditing(false)
                }}
                className="signature-smolder text-[#4c1a00] px-4 py-2 text-[10px] font-bold uppercase tracking-wider cursor-pointer"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => {
                  setTitle(ad.title)
                  setClickUrl(ad.click_url ?? '')
                  setEditing(false)
                }}
                className="ghost-border text-stone-400 px-4 py-2 text-[10px] font-bold uppercase tracking-wider cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="font-headline font-bold text-[#e5e2e1] text-sm mb-1 break-words">{ad.title}</p>
            {ad.click_url && (
              <a
                href={ad.click_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#ffb595] hover:text-[#ee671c] text-xs break-all"
              >
                {ad.click_url}
              </a>
            )}
            <p className="text-[10px] text-stone-600 uppercase tracking-widest mt-2">
              {ad.impressions_count} impressions · {ad.clicks_count} clicks · {ad.ctr}% CTR · added {ad.created_at}
            </p>
          </>
        )}
      </div>
      <div className="flex md:flex-col items-center md:items-end gap-2 shrink-0">
        <button
          type="button"
          onClick={() => onToggle(ad.id)}
          className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-colors ${
            ad.enabled
              ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
              : 'bg-stone-500/20 text-stone-500 hover:bg-stone-500/30'
          }`}
        >
          {ad.enabled ? 'Enabled' : 'Disabled'}
        </button>
        {!editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-stone-500 hover:text-[#ffb595] cursor-pointer"
            aria-label="Edit"
          >
            <span className="material-symbols-outlined text-lg">edit</span>
          </button>
        )}
        <button
          type="button"
          onClick={() => onDestroy(ad.id, ad.title)}
          className="text-red-400/50 hover:text-red-400 cursor-pointer"
          aria-label="Delete"
        >
          <span className="material-symbols-outlined text-lg">delete</span>
        </button>
      </div>
    </div>
  )
}
