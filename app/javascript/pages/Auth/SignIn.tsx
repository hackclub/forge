import { useEffect, useRef, useState } from 'react'
import { Head } from '@inertiajs/react'
import FireIcon from '@/components/FireIcon'

export default function AuthSignIn() {
  const [email, setEmail] = useState('')
  const parallaxRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return

    const node = parallaxRef.current
    if (!node) return

    let rafId = 0
    let targetX = 0
    let targetY = 0
    let currentX = 0
    let currentY = 0
    const maxOffset = 20

    const onMove = (e: MouseEvent) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1
      const ny = (e.clientY / window.innerHeight) * 2 - 1
      targetX = -nx * maxOffset
      targetY = -ny * maxOffset
      if (!rafId) rafId = requestAnimationFrame(tick)
    }

    const tick = () => {
      currentX += (targetX - currentX) * 0.08
      currentY += (targetY - currentY) * 0.08
      node.style.setProperty('--parallax-x', `${currentX.toFixed(2)}px`)
      node.style.setProperty('--parallax-y', `${currentY.toFixed(2)}px`)
      if (Math.abs(targetX - currentX) > 0.1 || Math.abs(targetY - currentY) > 0.1) {
        rafId = requestAnimationFrame(tick)
      } else {
        rafId = 0
      }
    }

    window.addEventListener('mousemove', onMove)
    return () => {
      window.removeEventListener('mousemove', onMove)
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [])

  function submitEmail(e: React.FormEvent) {
    e.preventDefault()
    const url = `/auth/hca/start?email=${encodeURIComponent(email.trim())}`
    window.location.href = url
  }

  return (
    <>
      <Head title="Forge - Sign In" />

      <div className="min-h-screen bg-[#0e0e0e] text-[#e5e2e1] relative overflow-hidden flex flex-col items-center justify-center px-6 py-12">
        <div ref={parallaxRef} className="login-bg-parallax fixed inset-0 pointer-events-none z-0">
          <div
            className="login-bg absolute inset-[-4%] bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: 'url(/login_page_bg.png?v=2)' }}
          />
        </div>
        <div className="fixed inset-0 pointer-events-none z-0 bg-[#0e0e0e]/40" />

        <div className="login-card relative z-10 w-full max-w-md">
          <div className="bg-[#1c1b1b]/90 backdrop-blur-sm ghost-border p-8 md:p-10">
            <div className="text-center mb-8">
              <h1 className="text-2xl md:text-3xl font-headline font-bold tracking-tight text-[#e5e2e1] mb-2">
                Hey! Welcome to Forge
              </h1>
              <p className="text-stone-500 text-sm">If you don't already have an account, we'll make one for you.</p>
            </div>

            <a
              href="/auth/hca/start"
              className="w-full signature-smolder text-[#4c1a00] font-headline font-bold py-3 uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            >
              <FireIcon className="text-lg" />
              Log in with Hack Club Auth
            </a>

            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-stone-600">Or</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            <form onSubmit={submitEmail} className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full bg-[#0e0e0e] border-none px-4 py-3 text-[#e5e2e1] text-sm focus:ring-1 focus:ring-[#ca5924]/30 placeholder:text-stone-600"
              />
              <button
                type="submit"
                className="w-full ghost-border bg-[#0e0e0e] hover:bg-[#2a2a2a] text-stone-400 hover:text-[#ffb595] font-headline font-bold py-3 uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">mail</span>
                Send login code
              </button>
            </form>

            <p className="text-stone-600 text-[10px] text-center mt-6 leading-relaxed">
              Login codes and passwords are handled by Hack Club Auth.
            </p>
          </div>

          <p className="text-center text-stone-600 text-xs mt-6">
            <a href="/" className="hover:text-[#ffb595] transition-colors">
              ← Back home
            </a>
          </p>
        </div>
      </div>
    </>
  )
}

AuthSignIn.layout = (page: React.ReactNode) => page
