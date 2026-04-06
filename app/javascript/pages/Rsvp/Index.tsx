import { useState, useMemo } from 'react'
import { Head } from '@inertiajs/react'

const FORGE_ICONS = ['hardware', 'memory', 'developer_board', 'precision_manufacturing', 'build', 'construction', 'handyman', 'architecture', 'terminal', 'chip_extraction', 'img:/flag-orpheus.svg', 'img:/hc-icon.svg']

function FloatingIcons() {
  const icons = useMemo(() => {
    const seeded = (s: number) => ((s * 9301 + 49297) % 233280) / 233280
    const cols = 10
    const rows = 6
    const cellW = 100 / cols
    const cellH = 100 / rows
    return Array.from({ length: cols * rows }, (_, i) => {
      const col = i % cols
      const row = Math.floor(i / cols)
      const duration = 25 + seeded(i * 7) * 20
      return {
        icon: FORGE_ICONS[i % FORGE_ICONS.length],
        left: `${col * cellW + seeded(i * 13 + 1) * cellW * 0.6}%`,
        delay: -(seeded(i * 3 + 5) * duration + row * 4),
        duration,
        size: 28 + seeded(i * 11 + 2) * 36,
        opacity: 0.08 + seeded(i * 5 + 3) * 0.12,
      }
    })
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <style dangerouslySetInnerHTML={{ __html: `@keyframes float { 0% { transform: translateY(110vh); } 100% { transform: translateY(-100px); } }` }} />
      {icons.map((item, i) =>
        item.icon.startsWith('img:') ? (
          <img
            key={i}
            src={item.icon.slice(4)}
            alt=""
            className="absolute"
            style={{
              left: item.left,
              width: `${item.size}px`,
              height: `${item.size}px`,
              opacity: item.opacity,
              animation: `float ${item.duration}s ${item.delay}s linear infinite`,
              filter: 'grayscale(1) brightness(0.6)',
            }}
          />
        ) : (
          <span
            key={i}
            className="material-symbols-outlined absolute text-[#ffb595]"
            style={{
              left: item.left,
              fontSize: `${item.size}px`,
              opacity: item.opacity,
              animation: `float ${item.duration}s ${item.delay}s linear infinite`,
            }}
          >
            {item.icon}
          </span>
        )
      )}
    </div>
  )
}

const SOCIAL_LINKS = [
  { href: 'https://hackclub.com/slack', icon: 'chat', label: 'Slack' },
  { href: 'https://twitter.com/hackclub', icon: 'alternate_email', label: 'Twitter' },
  { href: 'https://github.com/hackclub', icon: 'code', label: 'GitHub' },
  { href: 'https://www.youtube.com/c/HackClubHQ', icon: 'play_circle', label: 'YouTube' },
  { href: 'https://www.instagram.com/starthackclub', icon: 'photo_camera', label: 'Instagram' },
  { href: 'mailto:team@hackclub.com', icon: 'mail', label: 'Email' },
]

function Footer() {
  return (
    <footer className="relative z-10 border-t border-white/5 mt-auto">
      <div className="max-w-[1400px] mx-auto px-8 md:px-16 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          <div>
            <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-500 mb-4">Hack Club</h3>
            <div className="flex flex-col gap-2">
              <a href="https://hackclub.com/philosophy" className="text-stone-500 text-sm hover:text-stone-300 transition-colors">Philosophy</a>
              <a href="https://hackclub.com/team" className="text-stone-500 text-sm hover:text-stone-300 transition-colors">Our Team</a>
              <a href="https://hackclub.com/jobs" className="text-stone-500 text-sm hover:text-stone-300 transition-colors">Jobs</a>
              <a href="https://hackclub.com/press" className="text-stone-500 text-sm hover:text-stone-300 transition-colors">Press</a>
              <a href="https://hackclub.com/philanthropy" className="text-stone-500 text-sm hover:text-stone-300 transition-colors">Donate</a>
            </div>
          </div>
          <div>
            <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-500 mb-4">Resources</h3>
            <div className="flex flex-col gap-2">
              <a href="https://hackclub.com/pizza" className="text-stone-500 text-sm hover:text-stone-300 transition-colors">Pizza Grant</a>
              <a href="https://events.hackclub.com/" className="text-stone-500 text-sm hover:text-stone-300 transition-colors">Events</a>
              <a href="https://jams.hackclub.com/" className="text-stone-500 text-sm hover:text-stone-300 transition-colors">Jams</a>
              <a href="https://toolbox.hackclub.com/" className="text-stone-500 text-sm hover:text-stone-300 transition-colors">Toolbox</a>
              <a href="https://hackclub.com/conduct/" className="text-stone-500 text-sm hover:text-stone-300 transition-colors">Code of Conduct</a>
            </div>
          </div>
          <div className="col-span-2 md:col-span-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="128" height="45" fill="#57534e" viewBox="0 0 256 90" className="mb-4">
              <path d="M75.156 38.08l6.475 1.105s1.798-11.402-.224-10.199l-6.251 9.094zM204.85 34.495l2.161 5.06s5.237-2.106 4.619-4.915c-.537-2.442-3.098-1.496-5.641-.557h-.001c-.382.142-.764.282-1.138.412zM207.752 43.455s1.483 6.212 1.421 5.93c-.007-.093.397-.247 1.002-.477 2.014-.766 6.257-2.379 4.999-5.453-1.636-3.997-7.422 0-7.422 0z" />
              <path fillRule="evenodd" d="M7.205 89.303c-.022-2.227-.161-16.553 3.072-32.54 15.846-2.401 28.778.144 54.94 7.37 5.142 1.42 10.135 2.927 15.139 4.437 21.52 6.494 43.238 13.047 77.819 13.047 39.513 0 89.839-46.125 96.97-52.854.321-.303.07-.804-.37-.798a895.798 895.798 0 01-22.817-.006.484.484 0 01-.422-.707L241.991 6.9c.186-.36-.392-.91-.737-.696-10.403 6.44-68.291 38.655-125.701 11.127C62.987-7.874 36.693.801 29.405 4.381c.206-.647.195-1.355-.559-1.45-.953-.121-1.458.46-1.458.46-.955.738-11.701 20.409-18.91 41.665C1.272 66.313-.092 87.361.006 89.551h7.202c0-.049 0-.132-.002-.248zm33.522-73.187c-.647 3.657-1.888 9.939-4.497 18.056-5.42 12.948 3.823 10.836 6.47 5.457 1.569-2.97 3.182-6.194 3.182-6.194l8.307 3.185s-.669 3.783-1.353 6.912c-2.61 8.118 4.998 7.144 7.102 1.146.177-.583.477-1.518.856-2.697 1.62-5.045 4.672-14.553 5.648-20.073 1.814-4.357-4.395-8.336-7.205-1.295-1.502 2.593-3.941 8.27-3.941 8.27s-6.857-2.534-6.938-2.81c-.14-.362.021-1.024.212-1.812.177-.727.38-1.562.397-2.37-.418-11.655-7.37-10.693-8.24-5.775zm36.6 9.076c2.114-4.209 4.542-4.915 6.347-4.723.779.065 1.838 1.648 2.648 3.17 2.651 10.02-2.1 28.448-2.94 29.686-2.892 4.671-7.967 3.788-6.04-1.259.901-3.066 1.865-5.852 1.865-5.852l-6.568-.734c-5.162 10.028-9.802 5.829-7.128 1.497 2.861-5.074 8.956-16.183 11.816-21.785zm33.437 10.102c.857-2.414-.924-7.875-7.149-6.964-9.016.065-12.136 15.862-12.136 15.862s-1.498 7.65.867 12.865c1.971 4.611 6.52 5.007 8.041 5.139.137.012.25.022.334.032 5.917-1.78 3.891-5.722 2.879-5.849-.221-.011-.456-.014-.701-.018-1.178-.015-2.578-.034-3.746-.988-2.393-1.928-1.967-6.824-1.447-9.457 1.224-4.429 3.918-13.223 8.213-11.07 2.577 3.293 4.386 1.78 4.845.448zm5.93-.406c-.608 1.855-.691 3.748-.785 5.895-.151 3.458-.332 7.576-2.777 13.261-.68 1.62-2.071 4.212-2.9 5.756-.323.602-.561 1.045-.638 1.21-2.196 4.16 2.263 6.611 7.175-.657 1.19-1.664 2.501-5.919 2.501-5.919l2.137-.24s1.867 8.216 2.296 11.736c.46 3.396 6.476 5.328 6.564-1.338-.215-2.285-1.011-5.374-2.509-9.298 0 0-.978-2.874-1.925-3.247 0 0 6.713-6.677 7.353-9.268.67-2.714-.552-4.6-5.802-.172-5.249 4.428-5.858 5.846-5.858 5.846s1.248-5.583 1.123-9.812c.456-4.473-4.584-7.73-5.955-3.753zm33.811 8.412c-2.253 2.233-3.67 6.425-3.512 12.767.314 9.466 4.236 14.906 10.933 13.822 6.697-1.083 5.12-5.915 4.503-6.075-.088-.022-.163-.059-.244-.098-.376-.181-.861-.415-3.12.435-2.746 1.032-4.814-.173-6.545-4.375-1.144-2.843-1.764-8.367.302-11.452.537-.795 1.051-1.088 1.378-1.275l.075-.042.039-.024.019-.011c1.235-.753 2.5-.023 2.717.166 3.458 2.504 4.135-.27 2.899-2.736-2.44-3.446-5.681-4.15-9.444-1.102zm14.971.143c-.033-3.593 3.677-6.363 4.981 1.672.926 2.985 1.185 7.574 1.384 11.111.147 2.614.262 4.655.59 5.05.773.93 6.526-.368 8.084-.892 1.558-.524 4.428.164 3.78 1.724-.423 1.281-1.467 1.63-2.02 1.814-.134.045-.239.08-.3.116-.309.187-13.313 4.042-13.796 1.475-.342-1.815-.457-2.938-.667-4.986h-.001c-.087-.848-.19-1.854-.332-3.133-.178-1.594-.448-3.404-.721-5.234h-.001c-.475-3.187-.961-6.434-.981-8.717zm15.594-3.216c-.282-2.598 2.367-4.185 3.927-1.396.534.974 1.107 3.415 1.752 6.165.788 3.354 1.682 7.167 2.746 9.337 1.06 1.599 3.243 1.887 4.271.42 1.214-2.218.338-7.759-.413-12.204a62.31 62.31 0 00-.479-1.777v-.001c-.361-1.286-.655-2.334-.634-3.168.466-4.003 3.677-3.055 5.175 1.049 1.249 4.572 2.551 11.959 1.898 14.585l-.074.3c-.604 2.447-1.329 5.39-4.442 6.131-.842.185-7.855 1.196-10.321-6.477l-.757-2.562c-1.783-6.024-2.399-8.103-2.649-10.402zm21.992-8.576c4.312-2.607 7.547-3.502 10.075-2.589 1.48.91 2.436 3.407 2.037 5.558-.461 1.87-1.231 3.396-1.231 3.396 2.559.258 4.432 2.811 4.918 6.153.487 3.341-2.661 6.486-8.515 8.433-1.972.556-4.067.549-4.16-.138-.063-1.341-5.033-17.326-5.033-17.326-.015-.096-.034-.193-.053-.29-.175-.892-.37-1.884 1.962-3.197z" clipRule="evenodd" />
            </svg>
            <div className="flex gap-3 mb-4">
              {SOCIAL_LINKS.map((link) => (
                <a key={link.label} href={link.href} target="_blank" rel="noopener" title={link.label} className="text-stone-600 hover:text-stone-400 transition-colors">
                  <span className="material-symbols-outlined text-xl">{link.icon}</span>
                </a>
              ))}
            </div>
            <p className="text-stone-600 text-xs">
              <a href="tel:1-855-625-HACK" className="hover:text-stone-400 transition-colors">1-855-625-HACK</a>
              <span className="text-stone-700"> (toll-free)</span>
            </p>
          </div>
        </div>
        <p className="text-stone-700 text-xs mt-8">
          © {new Date().getFullYear()} Hack Club. 501(c)(3) nonprofit (EIN: 81-2908499)
        </p>
      </div>
    </footer>
  )
}

export default function RsvpIndex() {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setState('submitting')
    setErrorMsg('')

    try {
      const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content
      const res = await fetch('/rsvp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
        },
        body: JSON.stringify({ email }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Something went wrong.')
      }

      setState('success')
    } catch (err) {
      setState('error')
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong.')
    }
  }

  return (
    <>
      <Head title="Forge — RSVP" />

      <div className="min-h-screen bg-[#0e0e0e] text-[#e5e2e1] relative overflow-hidden flex flex-col">
        <FloatingIcons />

        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(168,138,126,0.04) 1px, transparent 0)',
          backgroundSize: '48px 48px',
        }} />

        <nav className="relative z-10 flex justify-between items-center px-8 md:px-16 py-8">
          <span className="text-2xl font-bold tracking-tighter text-[#ffb595] uppercase font-headline">Forge</span>
          <a href="/auth/hca/start" className="text-stone-500 hover:text-[#ffb595] transition-colors text-xs font-bold uppercase tracking-[0.2em] flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">login</span>
            Beta Sign In
          </a>
        </nav>

        <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pb-24">
          <div className="text-center mb-12 max-w-2xl">
            <p className="text-[10px] uppercase tracking-[0.3em] text-[#ee671c] font-bold mb-6">Coming Soon</p>
            <h1 className="text-5xl md:text-7xl font-headline font-bold tracking-tighter leading-[0.95] mb-6">
              Build hardware.
              <br />
              <span className="text-[#ee671c]">Get funded.</span>
            </h1>
            <p className="text-stone-400 text-base md:text-lg leading-relaxed max-w-lg mx-auto">
              Got a hardware idea? We'll help you build it.
              Unlimited funding for teen makers, ages 13–18.
              Drop your email to get notified when Forge launches.
            </p>
          </div>

          <div className="w-full max-w-xl bg-[#1c1b1b]/80 backdrop-blur-sm ghost-border p-8 md:p-10">
            {state === 'success' ? (
              <div className="text-center py-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-[#ee671c]/15 mb-6">
                  <span className="material-symbols-outlined text-4xl text-[#ee671c]">local_fire_department</span>
                </div>
                <h2 className="text-2xl font-headline font-bold text-[#e5e2e1] mb-3">You&apos;re on the list!</h2>
                <p className="text-stone-400 text-sm">
                  Thanks for signing up! You'll be the first to know when Forge launches :)
                </p>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-5">
                <div>
                  <label htmlFor="email" className="block text-[10px] font-bold uppercase tracking-[0.25em] text-stone-500 mb-3">
                    RSVP for Forge
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    disabled={state === 'submitting'}
                    className="w-full bg-[#0e0e0e] border-none px-5 py-4 text-[#e5e2e1] text-base focus:ring-1 focus:ring-[#ee671c]/30 placeholder:text-stone-600"
                  />
                </div>

                <button
                  type="submit"
                  disabled={state === 'submitting'}
                  className="w-full signature-smolder text-[#4c1a00] font-headline font-bold py-4 uppercase tracking-[0.2em] text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {state === 'submitting' ? (
                    <>
                      <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-lg">local_fire_department</span>
                      RSVP for Forge
                    </>
                  )}
                </button>

                {state === 'error' && errorMsg && (
                  <p className="text-red-400 text-sm flex items-center gap-2 justify-center">
                    <span className="material-symbols-outlined text-sm">error</span>
                    {errorMsg}
                  </p>
                )}
              </form>
            )}
          </div>
        </main>

        <Footer />
      </div>
    </>
  )
}

RsvpIndex.layout = (page: React.ReactNode) => page
