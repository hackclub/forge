import { useEffect, useRef, useState } from 'react'

const SRC = '/forge-theme.mp3'
const STORAGE_KEY = 'forge-bgm-muted'

export default function ForgeMusic() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [muted, setMuted] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === '1'
    } catch {
      return false
    }
  })

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.volume = 0.5

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
      localStorage.setItem(STORAGE_KEY, muted ? '1' : '0')
    } catch {
      void 0
    }
  }, [muted])

  return (
    <>
      <audio ref={audioRef} src={SRC} loop preload="auto" />
      <button
        type="button"
        onClick={() => setMuted((m) => !m)}
        aria-label={muted ? 'Unmute music' : 'Mute music'}
        title={muted ? 'Unmute music' : 'Mute music'}
        className="fixed bottom-4 right-4 z-[130] flex size-10 items-center justify-center bg-[#1c1b1b]/90 text-stone-300 ghost-border backdrop-blur-sm transition-colors hover:text-[#ffb595]"
      >
        <span className="material-symbols-outlined text-xl">{muted ? 'volume_off' : 'volume_up'}</span>
      </button>
    </>
  )
}
