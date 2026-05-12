import { useState } from 'react'
import { Head, Link, router } from '@inertiajs/react'
import { Plus, X, Pencil, Trash2, ArrowLeft } from 'lucide-react'
import { Badge } from '@/components/admin/ui/badge'
import { Button } from '@/components/admin/ui/button'
import { Card, CardContent } from '@/components/admin/ui/card'
import { Input } from '@/components/admin/ui/input'

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
    const dispatch = () => {
      router.post('/admin/reel_ads', fd, {
        forceFormData: true,
        onSuccess: reset,
        onError: (errs) => setError(Object.values(errs).join(', ')),
        onFinish: () => setSubmitting(false),
      })
    }
    v.onloadedmetadata = () => {
      if (!isNaN(v.duration) && v.duration > 0) {
        fd.append('duration_seconds', String(Math.round(v.duration)))
      }
      dispatch()
    }
    v.onerror = dispatch
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
      <div className="max-w-6xl mx-auto space-y-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin">
            <ArrowLeft className="size-4" />
            Admin
          </Link>
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Reel Ads</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Video ads are randomly mixed into the reels feed every few items.
            </p>
          </div>
          <Button onClick={() => (showForm ? reset() : setShowForm(true))}>
            {showForm ? <X className="size-4" /> : <Plus className="size-4" />}
            {showForm ? 'Cancel' : 'New Ad'}
          </Button>
        </div>

        {showForm && (
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={submit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Title</label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    maxLength={200}
                    placeholder="Sponsor Co. — buy our soldering iron"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Click URL (optional)</label>
                  <Input type="url" value={clickUrl} onChange={(e) => setClickUrl(e.target.value)} placeholder="https://example.com" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Video (≤ {max_video_mb} MB)</label>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => setVideo(e.target.files?.[0] ?? null)}
                    required
                    className="w-full text-sm file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-secondary file:text-secondary-foreground file:text-xs file:font-medium file:cursor-pointer"
                  />
                </div>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
                  Enable immediately
                </label>
                {error && <p className="text-destructive text-xs">{error}</p>}
                <div className="flex gap-2">
                  <Button type="submit" disabled={submitting}>
                    {submitting ? 'Uploading…' : 'Create'}
                  </Button>
                  <Button type="button" variant="outline" onClick={reset}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {ads.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-base font-medium mb-1">No ads yet</p>
              <p className="text-sm text-muted-foreground">Create one to start serving ads in the reels feed.</p>
            </CardContent>
          </Card>
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
    <Card>
      <CardContent className="p-4 flex flex-col md:flex-row gap-4">
        <video
          src={ad.video_url}
          muted
          loop
          playsInline
          preload="metadata"
          className="w-full md:w-40 aspect-[9/16] object-cover bg-black shrink-0 rounded-md"
          onMouseEnter={(e) => e.currentTarget.play().catch(() => {})}
          onMouseLeave={(e) => e.currentTarget.pause()}
        />
        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="space-y-2">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              <Input type="url" value={clickUrl} onChange={(e) => setClickUrl(e.target.value)} placeholder="https://..." />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    onSave(ad, { title, click_url: clickUrl })
                    setEditing(false)
                  }}
                >
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setTitle(ad.title)
                    setClickUrl(ad.click_url ?? '')
                    setEditing(false)
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <p className="font-medium break-words">{ad.title}</p>
              {ad.click_url && (
                <a href={ad.click_url} target="_blank" rel="noopener noreferrer" className="text-xs hover:underline break-all">
                  {ad.click_url}
                </a>
              )}
              <p className="text-xs text-muted-foreground uppercase tracking-wide mt-2">
                {ad.impressions_count} impressions · {ad.clicks_count} clicks · {ad.ctr}% CTR · added {ad.created_at}
              </p>
            </>
          )}
        </div>
        <div className="flex md:flex-col items-center md:items-end gap-2 shrink-0">
          <button onClick={() => onToggle(ad.id)} className="cursor-pointer">
            {ad.enabled ? <Badge variant="success">Enabled</Badge> : <Badge variant="secondary">Disabled</Badge>}
          </button>
          {!editing && (
            <Button size="icon" variant="ghost" onClick={() => setEditing(true)}>
              <Pencil className="size-4" />
            </Button>
          )}
          <Button size="icon" variant="ghost" onClick={() => onDestroy(ad.id, ad.title)}>
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
