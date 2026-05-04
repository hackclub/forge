import { useEffect, useRef, useState } from 'react'
import { Head, Link, router, usePage } from '@inertiajs/react'
import type { SharedProps } from '../../types'

type Kind = 'video' | 'image_carousel' | 'slideshow'

interface Props {
  project: { id: number; name: string }
  max_duration_seconds: number
  max_video_mb: number
  max_image_mb: number
  max_audio_mb: number
  max_images: number
}

const KIND_OPTIONS: { kind: Kind; label: string; icon: string; subtitle: string }[] = [
  { kind: 'video', label: 'Video', icon: 'videocam', subtitle: 'Upload a short clip — up to 60s.' },
  { kind: 'image_carousel', label: 'Carousel', icon: 'collections', subtitle: 'Up to 10 images, swipe to flip through.' },
  { kind: 'slideshow', label: 'Slideshow', icon: 'audiotrack', subtitle: 'Images that play with a music track.' },
]

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function ReelsNew(props: Props) {
  const { project, max_duration_seconds, max_video_mb, max_image_mb, max_audio_mb, max_images } = props
  const page = usePage<SharedProps>()

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [kind, setKind] = useState<Kind>('video')

  const [video, setVideo] = useState<File | null>(null)
  const [videoPreview, setVideoPreview] = useState<string | null>(null)
  const [duration, setDuration] = useState<number | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  const [images, setImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])

  const [audio, setAudio] = useState<File | null>(null)
  const [audioPreview, setAudioPreview] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const alert = page.props.flash?.alert
    if (alert) {
      setError(alert)
      setSubmitting(false)
      setProgress(0)
    }
  }, [page.props.flash])

  useEffect(() => {
    return () => {
      if (videoPreview) URL.revokeObjectURL(videoPreview)
      imagePreviews.forEach((u) => URL.revokeObjectURL(u))
      if (audioPreview) URL.revokeObjectURL(audioPreview)
    }
  }, [videoPreview, imagePreviews, audioPreview])

  function pickKind(k: Kind) {
    setKind(k)
    setVideo(null)
    setVideoPreview(null)
    setImages([])
    setImagePreviews([])
    setAudio(null)
    setAudioPreview(null)
    setDuration(null)
    setError(null)
    setStep(2)
  }

  function acceptVideo(f: File) {
    setError(null)
    if (!f.type.startsWith('video/')) return setError('Please choose a video file.')
    if (f.size / (1024 * 1024) > max_video_mb) return setError(`Max video size is ${max_video_mb} MB.`)
    setVideo(f)
    setVideoPreview(URL.createObjectURL(f))
  }

  function acceptImages(files: File[]) {
    setError(null)
    if (files.length === 0) return
    const combined = [...images, ...files].slice(0, max_images)
    if (combined.some((f) => !f.type.startsWith('image/'))) return setError('All files must be images.')
    if (combined.some((f) => f.size / (1024 * 1024) > max_image_mb))
      return setError(`Each image must be ≤ ${max_image_mb} MB.`)
    setImages(combined)
    setImagePreviews(combined.map((f) => URL.createObjectURL(f)))
  }

  function acceptAudio(f: File) {
    setError(null)
    if (!f.type.startsWith('audio/')) return setError('Please choose an audio file.')
    if (f.size / (1024 * 1024) > max_audio_mb) return setError(`Max audio size is ${max_audio_mb} MB.`)
    setAudio(f)
    setAudioPreview(URL.createObjectURL(f))
  }

  function onVideoMeta() {
    const v = videoRef.current
    if (!v) return
    const d = Math.round(v.duration)
    setDuration(d)
    if (d > max_duration_seconds) setError(`Video is ${d}s. Max is ${max_duration_seconds}s.`)
  }

  function removeImage(idx: number) {
    setImages((prev) => prev.filter((_, i) => i !== idx))
    setImagePreviews((prev) => prev.filter((_, i) => i !== idx))
  }

  function step2Ready(): boolean {
    if (kind === 'video') return !!video && !error
    if (kind === 'image_carousel') return images.length > 0 && !error
    if (kind === 'slideshow') return images.length > 0 && !!audio && !error
    return false
  }

  function totalBytes(): number {
    if (kind === 'video') return video?.size ?? 0
    let n = images.reduce((sum, f) => sum + f.size, 0)
    if (kind === 'slideshow' && audio) n += audio.size
    return n
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!step2Ready()) return setError('Add the required media first.')

    const data = new FormData()
    data.append('kind', kind)
    data.append('title', title)
    if (kind === 'video') {
      if (!video) return
      data.append('video', video)
      if (duration) data.append('duration_seconds', String(duration))
    } else {
      images.forEach((img) => data.append('images[]', img))
      if (kind === 'slideshow' && audio) data.append('audio', audio)
    }

    setError(null)
    setSubmitting(true)
    setProgress(0)
    router.post(`/projects/${project.id}/reels`, data, {
      forceFormData: true,
      preserveState: true,
      preserveScroll: true,
      onProgress: (p) => {
        if (p?.percentage != null) setProgress(p.percentage)
      },
      onError: (errs) => {
        setSubmitting(false)
        setProgress(0)
        const msg = Object.values(errs).flat().join(', ')
        if (msg) setError(msg)
      },
      onFinish: () => {
        setSubmitting(false)
      },
    })
  }

  return (
    <>
      <Head title="New Reel - Forge" />
      <div className="p-5 md:p-12 max-w-2xl mx-auto">
        <div className="mb-8">
          <Link
            href={`/projects/${project.id}`}
            className="text-stone-500 hover:text-[#ffb595] text-xs uppercase tracking-[0.2em] font-bold inline-flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            {project.name}
          </Link>
          <h1 className="text-3xl sm:text-4xl font-headline font-bold tracking-tight text-[#e5e2e1] mt-3">
            New Reel
          </h1>
          <div className="flex items-center gap-2 mt-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className={`h-1 flex-1 ${s <= step ? 'bg-[#ee671c]' : 'bg-stone-700'}`} />
            ))}
          </div>
          <p className="text-stone-500 text-xs mt-2">Step {step} of 3</p>
        </div>

        {step === 1 && (
          <div className="space-y-3">
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-500 mb-3">Pick a format</p>
            {KIND_OPTIONS.map((opt) => (
              <button
                key={opt.kind}
                type="button"
                onClick={() => pickKind(opt.kind)}
                className="w-full bg-[#1c1b1b] ghost-border hover:bg-[#2a2a2a] p-5 flex items-center gap-4 text-left transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-3xl text-[#ee671c] shrink-0">{opt.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-headline font-bold text-[#e5e2e1] text-base">{opt.label}</p>
                  <p className="text-stone-500 text-xs mt-0.5">{opt.subtitle}</p>
                </div>
                <span className="material-symbols-outlined text-stone-600">chevron_right</span>
              </button>
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-stone-500 hover:text-[#ffb595] text-[10px] uppercase tracking-[0.2em] font-bold inline-flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              Change format
            </button>

            {kind === 'video' && (
              <div className="bg-[#1c1b1b] ghost-border p-6">
                <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-500 mb-3">
                  Choose video ({max_duration_seconds}s max, {max_video_mb} MB max)
                </p>
                <DropZone
                  accept="video/*"
                  multiple={false}
                  onFiles={(fs) => fs[0] && acceptVideo(fs[0])}
                  icon="videocam"
                  label={video ? video.name : 'Drop a video here, or tap to choose'}
                  hint={video ? formatBytes(video.size) : `Up to ${max_video_mb} MB`}
                />
                {videoPreview && (
                  <video
                    ref={videoRef}
                    src={videoPreview}
                    controls
                    playsInline
                    onLoadedMetadata={onVideoMeta}
                    className="w-full max-h-[60vh] mt-4 bg-black"
                  />
                )}
                {duration !== null && (
                  <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-500 mt-3">
                    Duration: {duration}s
                  </p>
                )}
              </div>
            )}

            {(kind === 'image_carousel' || kind === 'slideshow') && (
              <div className="bg-[#1c1b1b] ghost-border p-6">
                <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-500 mb-3">
                  Images ({images.length} / {max_images}, {max_image_mb} MB each)
                </p>
                <DropZone
                  accept="image/*"
                  multiple
                  onFiles={(fs) => acceptImages(fs)}
                  icon="add_photo_alternate"
                  label={images.length === 0 ? 'Drop images here, or tap to choose' : 'Add more images'}
                  hint={`${images.length} / ${max_images}`}
                />
                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-4">
                    {imagePreviews.map((src, idx) => (
                      <div key={idx} className="relative group">
                        <img src={src} alt="" className="w-full aspect-square object-cover" />
                        <span className="absolute top-1 left-1 text-[10px] bg-black/70 text-white px-1.5 py-0.5 font-bold">
                          {idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute top-1 right-1 bg-black/70 hover:bg-red-500 text-white w-6 h-6 flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                          aria-label="Remove"
                        >
                          <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {kind === 'slideshow' && (
              <div className="bg-[#1c1b1b] ghost-border p-6">
                <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-500 mb-3">
                  Audio track ({max_audio_mb} MB max)
                </p>
                <DropZone
                  accept="audio/*"
                  multiple={false}
                  onFiles={(fs) => fs[0] && acceptAudio(fs[0])}
                  icon="audiotrack"
                  label={audio ? audio.name : 'Drop an audio file here, or tap to choose'}
                  hint={audio ? formatBytes(audio.size) : `Up to ${max_audio_mb} MB`}
                />
                {audioPreview && <audio src={audioPreview} controls className="w-full mt-4" />}
              </div>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 px-4 py-3 text-red-300 text-sm">{error}</div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="ghost-border bg-[#1c1b1b] hover:bg-[#2a2a2a] text-stone-400 hover:text-[#ffb595] px-4 py-2.5 uppercase tracking-wider text-[10px] font-bold flex items-center gap-2 cursor-pointer"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => step2Ready() && setStep(3)}
                disabled={!step2Ready()}
                className="signature-smolder text-[#4c1a00] px-6 py-2.5 font-bold uppercase tracking-wider text-xs flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Next
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <form onSubmit={submit} className="space-y-6">
            <div className="bg-[#1c1b1b] ghost-border p-6">
              <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-500 mb-3">Title (optional)</p>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                placeholder="A short title for your reel..."
                className="w-full bg-[#0e0e0e] border-none px-4 py-3 text-[#e5e2e1] text-sm focus:ring-1 focus:ring-[#ee671c]/30 placeholder:text-stone-600"
                autoFocus
                disabled={submitting}
              />
              <p className="text-[10px] text-stone-600 text-right mt-1">{title.length} / 200</p>
            </div>

            <div className="bg-[#1c1b1b] ghost-border p-5">
              <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-500 mb-3">Preview</p>
              {kind === 'video' && videoPreview && (
                <video src={videoPreview} controls playsInline className="w-full max-h-[50vh] bg-black" />
              )}
              {kind === 'image_carousel' && imagePreviews.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {imagePreviews.map((src, idx) => (
                    <div key={idx} className="relative">
                      <img src={src} alt="" className="w-full aspect-square object-cover" />
                      <span className="absolute top-1 left-1 text-[10px] bg-black/70 text-white px-1.5 py-0.5 font-bold">
                        {idx + 1}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {kind === 'slideshow' && (
                <>
                  {imagePreviews.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-3">
                      {imagePreviews.map((src, idx) => (
                        <img key={idx} src={src} alt="" className="w-full aspect-square object-cover" />
                      ))}
                    </div>
                  )}
                  {audioPreview && <audio src={audioPreview} controls className="w-full" />}
                </>
              )}
              <p className="text-stone-500 text-xs mt-3">
                Total upload size: <span className="text-[#e5e2e1] font-bold">{formatBytes(totalBytes())}</span>
              </p>
            </div>

            {submitting && (
              <div className="bg-[#1c1b1b] ghost-border p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#ffb595]">
                    {progress < 100 ? 'Uploading' : 'Finishing up'}
                  </span>
                  <span className="text-[#e5e2e1] font-headline font-bold tabular-nums text-sm">{progress}%</span>
                </div>
                <div className="h-2 bg-[#0e0e0e] overflow-hidden">
                  <div
                    className="h-full signature-smolder transition-all duration-150"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-stone-600 text-[10px] mt-2">Don't close this tab.</p>
              </div>
            )}

            {error && !submitting && (
              <div className="bg-red-500/10 border border-red-500/30 px-4 py-3 text-red-300 text-sm">{error}</div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={submitting}
                className="ghost-border bg-[#1c1b1b] hover:bg-[#2a2a2a] text-stone-400 hover:text-[#ffb595] px-4 py-2.5 uppercase tracking-wider text-[10px] font-bold flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="signature-smolder text-[#4c1a00] px-6 py-2.5 font-bold uppercase tracking-wider text-xs flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">{submitting ? 'progress_activity' : 'upload'}</span>
                {submitting ? `Uploading… ${progress}%` : 'Publish'}
              </button>
            </div>
          </form>
        )}
      </div>
    </>
  )
}

interface DropZoneProps {
  accept: string
  multiple: boolean
  onFiles: (files: File[]) => void
  icon: string
  label: string
  hint: string
}

function DropZone({ accept, multiple, onFiles, icon, label, hint }: DropZoneProps) {
  const [hover, setHover] = useState(false)

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setHover(false)
    const fs = Array.from(e.dataTransfer.files)
    if (fs.length > 0) onFiles(fs)
  }

  return (
    <label
      onDragOver={(e) => {
        e.preventDefault()
        setHover(true)
      }}
      onDragLeave={() => setHover(false)}
      onDrop={onDrop}
      className={`block ghost-border p-6 text-center cursor-pointer transition-colors ${
        hover ? 'bg-[#2a2a2a] border-[#ee671c]' : 'bg-[#0e0e0e] hover:bg-[#161616]'
      }`}
    >
      <input
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={(e) => {
          const fs = Array.from(e.target.files ?? [])
          if (fs.length > 0) onFiles(fs)
          e.target.value = ''
        }}
        className="hidden"
      />
      <span className="material-symbols-outlined text-4xl text-[#ee671c] block mb-2">{icon}</span>
      <span className="text-stone-300 text-sm font-headline font-medium block break-all">{label}</span>
      <span className="text-stone-600 text-[10px] uppercase tracking-widest mt-2 block">{hint}</span>
    </label>
  )
}
