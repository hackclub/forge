import { Head, usePage } from '@inertiajs/react'
import type { SharedProps } from '@/types'

export default function LandingIndex() {
  const shared = usePage<SharedProps>().props
  const cta = shared.auth.user ? '/home' : shared.sign_in_path

  return (
    <>
      <Head title="Quarry — Build Hardware, Get Funded" />

      <div
        className="min-h-screen text-white relative"
        style={{
          backgroundColor: '#0e0c09',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='400' height='400' filter='url(%23n)' opacity='0.06'/%3E%3C/svg%3E")`,
        }}
      >
        {/* Corner flourishes */}
        <div className="absolute top-0 left-0 w-40 h-40 pointer-events-none">
          <svg viewBox="0 0 160 160" fill="none" className="w-full h-full opacity-25">
            <path d="M0 0 L60 0 L60 4 L4 4 L4 60 L0 60 Z" fill="#d4a017" />
            <path d="M20 0 L20 20 L0 20" stroke="#d4a017" strokeWidth="0.5" fill="none" />
          </svg>
        </div>
        <div className="absolute top-0 right-0 w-40 h-40 pointer-events-none scale-x-[-1]">
          <svg viewBox="0 0 160 160" fill="none" className="w-full h-full opacity-25">
            <path d="M0 0 L60 0 L60 4 L4 4 L4 60 L0 60 Z" fill="#d4a017" />
            <path d="M20 0 L20 20 L0 20" stroke="#d4a017" strokeWidth="0.5" fill="none" />
          </svg>
        </div>
        <div className="absolute bottom-0 left-0 w-40 h-40 pointer-events-none scale-y-[-1]">
          <svg viewBox="0 0 160 160" fill="none" className="w-full h-full opacity-25">
            <path d="M0 0 L60 0 L60 4 L4 4 L4 60 L0 60 Z" fill="#d4a017" />
            <path d="M20 0 L20 20 L0 20" stroke="#d4a017" strokeWidth="0.5" fill="none" />
          </svg>
        </div>
        <div className="absolute bottom-0 right-0 w-40 h-40 pointer-events-none scale-[-1]">
          <svg viewBox="0 0 160 160" fill="none" className="w-full h-full opacity-25">
            <path d="M0 0 L60 0 L60 4 L4 4 L4 60 L0 60 Z" fill="#d4a017" />
            <path d="M20 0 L20 20 L0 20" stroke="#d4a017" strokeWidth="0.5" fill="none" />
          </svg>
        </div>

        {/* Vignette */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)',
        }} />

        {/* ── Nav ── */}
        <nav className="relative z-10 flex items-center justify-between px-8 py-5 max-w-6xl mx-auto">
          <div className="flex items-center gap-2.5">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-yellow-600">
              <path d="M12 2L4 8V16L12 22L20 16V8L12 2Z" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.15" />
              <circle cx="12" cy="12" r="3" fill="currentColor" />
            </svg>
            <span className="font-black tracking-[0.2em] uppercase text-yellow-600 text-sm">Quarry</span>
          </div>
          <a
            href={cta}
            className="border border-yellow-700/50 hover:border-yellow-600 bg-yellow-800/10 hover:bg-yellow-800/20 text-yellow-400 hover:text-yellow-300 font-bold px-5 py-2 text-xs uppercase tracking-widest transition-all"
          >
            {shared.auth.user ? 'Dashboard' : 'Sign In'}
          </a>
        </nav>

        {/* ── Hero ── full width, centered, big impact */}
        <section className="relative z-10 max-w-6xl mx-auto px-8 pt-24 pb-20 text-center">
          <p className="text-yellow-100/25 text-sm mb-6 tracking-wide">Hack Club presents...</p>

          <h1 className="text-8xl sm:text-9xl md:text-[11rem] font-black leading-[0.75] tracking-tighter mb-10">
            <span className="bg-gradient-to-b from-yellow-200 via-yellow-500 to-yellow-800 bg-clip-text text-transparent">Quarry</span>
          </h1>

          <p className="text-yellow-100/70 text-xl sm:text-2xl font-bold leading-snug mb-3 max-w-2xl mx-auto">
            Build any hardware project — get up to{' '}
            <span className="text-yellow-300">$1,000</span> to make it real!
          </p>
          <p className="text-yellow-100/30 text-base leading-relaxed mb-10 max-w-lg mx-auto">
            The more people vote for your project, the more funding you earn per hour. For ages 13 to 18.
          </p>

          <div className="flex items-center justify-center gap-5">
            <a
              href={cta}
              className="relative bg-gradient-to-b from-yellow-500 to-yellow-700 hover:from-yellow-400 hover:to-yellow-600 text-[#1a1200] font-black px-10 py-4 text-sm uppercase tracking-[0.2em] transition-all shadow-[0_0_30px_rgba(180,130,20,0.15)] hover:shadow-[0_0_50px_rgba(180,130,20,0.35)] border border-yellow-500/30"
            >
              <span className="absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2 border-yellow-400/50" />
              <span className="absolute top-0 right-0 w-2.5 h-2.5 border-t-2 border-r-2 border-yellow-400/50" />
              <span className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b-2 border-l-2 border-yellow-400/50" />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b-2 border-r-2 border-yellow-400/50" />
              <span className="absolute top-0 left-[15%] right-[15%] h-px bg-gradient-to-r from-transparent via-yellow-300/60 to-transparent" />
              <span className="relative z-10">Get Started</span>
            </a>
            <a
              href="#how-it-works"
              className="text-yellow-100/25 hover:text-yellow-100/50 font-bold text-sm uppercase tracking-[0.2em] transition-colors py-4"
            >
              Learn more &darr;
            </a>
          </div>


        </section>

        {/* Divider */}
        <div className="relative z-10 flex items-center gap-4 max-w-6xl mx-auto px-8">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-yellow-700/40 to-transparent" />
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-yellow-600/40">
            <path d="M10 2L18 10L10 18L2 10Z" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="10" cy="10" r="2" fill="currentColor" />
          </svg>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-yellow-700/40 to-transparent" />
        </div>

        {/* ── How it works ── horizontal timeline style */}
        <section id="how-it-works" className="relative z-10">
          <div className="max-w-6xl mx-auto px-8 py-20">
            <h2 className="text-2xl sm:text-3xl font-black text-yellow-100/80 tracking-tight text-center mb-16">How it works</h2>

            {/* Timeline connector */}
            <div className="relative">
              <div className="hidden sm:block absolute top-8 left-0 right-0 h-px bg-gradient-to-r from-transparent via-yellow-700/30 to-transparent" />

              <div className="grid sm:grid-cols-3 gap-8">
                {[
                  { n: 'I', title: 'Stake your claim', desc: 'Design a circuit, solder a board, 3D print an enclosure — build a hardware project you\'re proud of.' },
                  { n: 'II', title: 'Enter the pit', desc: 'Ship your project. It enters head-to-head matchups where hackclubbers votes on which build is better.' },
                  { n: 'III', title: 'Strike gold', desc: 'Based on how your project did against other people your project recieves gold! (the more people that voted for you the more gold you get!)' },
                ].map((step) => (
                  <div key={step.n} className="text-center relative">
                    {/* Node dot */}
                    <div className="hidden sm:flex w-4 h-4 border-2 border-yellow-600/40 bg-[#0e0c09] mx-auto mb-6 rotate-45 items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-yellow-600/60" />
                    </div>

                    <div className="relative border border-yellow-800/30 bg-yellow-950/20 p-8 hover:border-yellow-700/50 transition-all group">
                      <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-yellow-700/40 group-hover:border-yellow-600/60 transition-colors" />
                      <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-yellow-700/40 group-hover:border-yellow-600/60 transition-colors" />
                      <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-yellow-700/40 group-hover:border-yellow-600/60 transition-colors" />
                      <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-yellow-700/40 group-hover:border-yellow-600/60 transition-colors" />
                      <span className="text-yellow-700/30 text-4xl font-black leading-none block mb-4 font-serif">{step.n}</span>
                      <h3 className="text-base font-black text-yellow-100/70 uppercase tracking-wider mb-3">{step.title}</h3>
                      <p className="text-yellow-100/25 text-sm leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="relative z-10 flex items-center gap-4 max-w-6xl mx-auto px-8">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-yellow-700/40 to-transparent" />
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-yellow-600/40">
            <path d="M10 2L18 10L10 18L2 10Z" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="10" cy="10" r="2" fill="currentColor" />
          </svg>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-yellow-700/40 to-transparent" />
        </div>

        {/* ── The twist ── big dramatic section */}
        <section className="relative z-10">
          <div className="max-w-6xl mx-auto px-8 py-24">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <p className="text-yellow-700/60 text-[10px] uppercase tracking-[0.4em] font-bold mb-4">The Twist</p>
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight mb-6">
                <span className="text-yellow-100/80">Your funding isn't fixed.</span>
                <br />
                <span className="bg-gradient-to-b from-yellow-300 via-yellow-500 to-yellow-700 bg-clip-text text-transparent">It's earned.</span>
              </h2>
              <p className="text-yellow-100/30 text-base leading-relaxed">
                Every builder votes on matchups between projects. An algorithm turns those votes into a ranking
                that sets your hourly rate. The community decides what's valuable — not a panel of judges.
                Keep shipping, keep climbing.
              </p>
            </div>

            {/* Visual: matchup mockup */}
            <div className="max-w-lg mx-auto">
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                <div className="border border-yellow-800/25 bg-yellow-950/15 p-5 text-center">
                  <div className="w-10 h-10 border border-yellow-700/20 bg-yellow-950/30 mx-auto mb-3" />
                  <p className="text-yellow-100/40 text-xs font-bold">Project A</p>
                  <p className="text-yellow-100/15 text-[10px] mt-1">by builder_1</p>
                </div>
                <div className="w-10 h-10 border border-yellow-800/30 bg-[#0e0c09] flex items-center justify-center rotate-45">
                  <span className="text-yellow-600/50 text-[10px] font-black -rotate-45">VS</span>
                </div>
                <div className="border border-yellow-800/25 bg-yellow-950/15 p-5 text-center">
                  <div className="w-10 h-10 border border-yellow-700/20 bg-yellow-950/30 mx-auto mb-3" />
                  <p className="text-yellow-100/40 text-xs font-bold">Project B</p>
                  <p className="text-yellow-100/15 text-[10px] mt-1">by builder_2</p>
                </div>
              </div>
              <p className="text-center text-yellow-100/12 text-xs mt-6 tracking-wide">
                You pick the winner. Votes shape the leaderboard. The leaderboard shapes funding.
              </p>
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="relative z-10 flex items-center gap-4 max-w-6xl mx-auto px-8">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-yellow-700/40 to-transparent" />
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-yellow-600/40">
            <path d="M10 2L18 10L10 18L2 10Z" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="10" cy="10" r="2" fill="currentColor" />
          </svg>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-yellow-700/40 to-transparent" />
        </div>

        {/* ── CTA ── */}
        <section className="relative z-10">
          <div className="max-w-6xl mx-auto px-8 py-24 text-center">
            <h2 className="text-3xl sm:text-4xl font-black text-yellow-100/80 tracking-tight mb-4">Ready to dig in?</h2>
            <p className="text-yellow-100/25 text-base mb-10 max-w-md mx-auto">
              Sign in with Slack to register your project and start earning.
            </p>
            <a
              href={cta}
              className="relative inline-block bg-gradient-to-b from-yellow-500 to-yellow-700 hover:from-yellow-400 hover:to-yellow-600 text-[#1a1200] font-black px-12 py-4 text-base uppercase tracking-[0.2em] transition-all shadow-[0_0_40px_rgba(180,130,20,0.15)] hover:shadow-[0_0_60px_rgba(180,130,20,0.3)] border border-yellow-500/30"
            >
              <span className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-yellow-400/50" />
              <span className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-yellow-400/50" />
              <span className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-yellow-400/50" />
              <span className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-yellow-400/50" />
              <span className="absolute top-0 left-[15%] right-[15%] h-px bg-gradient-to-r from-transparent via-yellow-300/60 to-transparent" />
              <span className="relative z-10">Enter the Quarry</span>
            </a>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="relative z-10 border-t border-yellow-900/30 py-6 text-center text-yellow-100/12 text-[10px] uppercase tracking-[0.4em] font-bold">
          Quarry &mdash; A Hack Club Event
        </footer>
      </div>
    </>
  )
}

LandingIndex.layout = (page: React.ReactNode) => page
