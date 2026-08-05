import { useEffect, useRef, useState } from 'react'

interface Track {
  src: string
  title: string
  artist?: string
}

const DASHBOARD_TRACKS: Track[] = [{ src: '/forgeous-beat.m4a', title: 'Forgeous Beat', artist: 'Cisco Disco' }]

export const LANDING_TRACKS: Track[] = [{ src: '/outside-the-forge.m4a', title: 'Outside the Forge', artist: 'Cisco Disco' }]

const MUTED_KEY = 'forge-bgm-muted'
const VOLUME_KEY = 'forge-bgm-volume'

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds)) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function ForgeMusic({
  tracks = DASHBOARD_TRACKS,
  position = 'bottom-20 left-4',
}: {
  tracks?: Track[]
  position?: string
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [trackIndex, setTrackIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [muted, setMuted] = useState(() => {
    try {
      return localStorage.getItem(MUTED_KEY) === '1'
    } catch {
      return false
    }
  })
  const [volume, setVolume] = useState(() => {
    try {
      const stored = parseFloat(localStorage.getItem(VOLUME_KEY) ?? '')
      return Number.isFinite(stored) ? Math.min(Math.max(stored, 0), 1) : 0.5
    } catch {
      return 0.5
    }
  })

  const track = tracks[trackIndex]

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    function tryPlay() {
      const p = audio?.play()
      if (p) p.then(remove, () => {})
    }
    function remove() {
      window.removeEventListener('pointerdown', tryPlay)
      window.removeEventListener('keydown', tryPlay)
    }

    tryPlay()
    window.addEventListener('pointerdown', tryPlay)
    window.addEventListener('keydown', tryPlay)
    return remove
  }, [])

  useEffect(() => {
    if (audioRef.current) audioRef.current.muted = muted
    try {
      localStorage.setItem(MUTED_KEY, muted ? '1' : '0')
    } catch {
      void 0
    }
  }, [muted])

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume
    try {
      localStorage.setItem(VOLUME_KEY, volume.toString())
    } catch {
      void 0
    }
  }, [volume])

  const trackChanged = useRef(false)
  useEffect(() => {
    if (!trackChanged.current) return
    trackChanged.current = false
    audioRef.current?.play().catch(() => {})
  }, [trackIndex])

  function skip(delta: number) {
    const next = (trackIndex + delta + tracks.length) % tracks.length
    if (next === trackIndex) {
      const audio = audioRef.current
      if (audio) {
        audio.currentTime = 0
        audio.play().catch(() => {})
      }
    } else {
      trackChanged.current = true
      setTrackIndex(next)
    }
  }

  function togglePlay() {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) audio.play().catch(() => {})
    else audio.pause()
  }

  function seek(value: number) {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = value
    setCurrentTime(value)
  }

  const controlClass =
    'flex cursor-pointer items-center justify-center text-stone-400 transition-colors hover:text-[#ffb595]'

  return (
    <>
      <audio
        ref={audioRef}
        src={track.src}
        preload="auto"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onEnded={() => skip(1)}
      />

      <div className={`group fixed ${position} z-30 hidden md:block`}>
        <div className="flex w-60 flex-col gap-2 bg-[#1c1b1b]/90 p-3 corner-accents ghost-border">
          <div className="text-center">
            <p className="truncate font-headline text-sm font-bold leading-tight text-[#f1e9df]">{track.title}</p>
            {track.artist && <p className="truncate text-[11px] text-stone-500">{track.artist}</p>}
          </div>

          <div>
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.1}
              value={Math.min(currentTime, duration || 0)}
              onChange={(e) => seek(parseFloat(e.target.value))}
              aria-label="Seek"
              className="h-1 w-full cursor-pointer accent-[#ca5924]"
            />
            <div className="flex justify-between font-mono text-[10px] tabular-nums text-stone-500">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          <div className="hidden items-center justify-center gap-2.5 group-hover:flex group-focus-within:flex">
            <button
              type="button"
              onClick={() => setMuted((m) => !m)}
              aria-label={muted ? 'Unmute music' : 'Mute music'}
              className={controlClass}
            >
              <span className="material-symbols-outlined text-lg">{muted ? 'volume_off' : 'volume_up'}</span>
            </button>
            <button type="button" onClick={() => skip(-1)} aria-label="Previous track" className={controlClass}>
              <span className="material-symbols-outlined text-xl">fast_rewind</span>
            </button>
            <button
              type="button"
              onClick={togglePlay}
              aria-label={playing ? 'Pause music' : 'Play music'}
              className="flex size-9 cursor-pointer items-center justify-center bg-[#2a2a2a] text-[#e5e2e1] ghost-border transition-colors hover:bg-[#3a3939] hover:text-[#ffb595]"
            >
              <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                {playing ? 'pause' : 'play_arrow'}
              </span>
            </button>
            <button type="button" onClick={() => skip(1)} aria-label="Next track" className={controlClass}>
              <span className="material-symbols-outlined text-xl">fast_forward</span>
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              aria-label="Volume"
              className="h-1 w-12 cursor-pointer accent-[#ca5924]"
            />
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setMuted((m) => !m)}
        aria-label={muted ? 'Unmute music' : 'Mute music'}
        title={muted ? 'Unmute music' : 'Mute music'}
        className="fixed bottom-4 right-4 z-[130] flex size-10 items-center justify-center bg-[#1c1b1b]/90 text-stone-300 ghost-border transition-colors hover:text-[#ffb595] md:hidden"
      >
        <span className="material-symbols-outlined text-xl">{muted ? 'volume_off' : 'volume_up'}</span>
      </button>
    </>
  )
}
