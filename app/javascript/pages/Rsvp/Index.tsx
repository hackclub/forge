import { useState } from 'react'
import { Head } from '@inertiajs/react'

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
        <div className="absolute top-1/4 -right-32 w-[600px] h-[600px] bg-[#ee671c]/10 blur-[140px] rounded-full pointer-events-none" />
        <div className="absolute bottom-1/4 -left-32 w-[500px] h-[500px] bg-[#7a2e25]/10 blur-[120px] rounded-full pointer-events-none" />

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
              Unlimited funding for teen makers!!!, ages 13–18.
              Drop your email to get notified when Forge launches.
            </p>
          </div>

          <div className="w-full max-w-xl bg-[#1c1b1b] ghost-border p-8 md:p-10">
            {state === 'success' ? (
              <div className="text-center py-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-[#ee671c]/15 mb-6">
                  <span className="material-symbols-outlined text-4xl text-[#ee671c]">local_fire_department</span>
                </div>
                <h2 className="text-2xl font-headline font-bold text-[#e5e2e1] mb-3">You&apos;re on the list!</h2>
                <p className="text-stone-400 text-sm">
                  Thanks for signing up! You'll be the first to know when forge launches :)
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

      </div>
    </>
  )
}

RsvpIndex.layout = (page: React.ReactNode) => page
