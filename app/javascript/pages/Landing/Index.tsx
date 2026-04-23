import { Head, usePage } from '@inertiajs/react'
import type { SharedProps } from '@/types'

export default function LandingIndex() {
  const shared = usePage<SharedProps>().props
  const cta = shared.auth.user ? '/home' : shared.sign_in_path

  return (
    <>
      <Head title="Forge - Build Hardware, Get Funded" />

      <div className="min-h-screen bg-[#0E0E0E] text-[#e5e2e1]">
        <nav className="fixed top-0 right-0 w-full h-16 z-40 bg-[#0E0E0E]/80 backdrop-blur-xl border-b border-white/5 flex justify-between items-center px-8">
          <div className="flex items-center gap-8">
            <span className="text-2xl font-bold tracking-tighter text-[#FFB595] uppercase font-headline">Forge</span>
            <div className="hidden md:flex gap-6 text-sm font-medium text-stone-400">
              <a className="hover:text-white transition-colors" href="/explore">
                Explore
              </a>
              <a className="hover:text-white transition-colors" href="/docs">
                Resources
              </a>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {shared.auth.user ? (
              <a
                href="/home"
                className="signature-smolder text-[#4c1a00] px-5 py-2 text-xs font-bold uppercase tracking-widest rounded-lg"
              >
                Dashboard
              </a>
            ) : (
              <>
                <a
                  href={shared.sign_in_path}
                  className="text-stone-400 hover:text-white transition-colors flex items-center gap-2 text-sm"
                >
                  <span className="material-symbols-outlined text-lg">login</span>
                  Sign In
                </a>
                <a
                  href={shared.sign_in_path}
                  className="signature-smolder text-[#4c1a00] px-5 py-2 text-xs font-bold uppercase tracking-widest rounded-lg"
                >
                  Get Started
                </a>
              </>
            )}
          </div>
        </nav>

        <main className="pt-16">
          <section className="relative min-h-[85vh] flex flex-col justify-center px-8 md:px-24 overflow-hidden">
            <div className="absolute top-1/4 -right-20 w-96 h-96 bg-[#ee671c]/10 blur-[120px] rounded-full" />
            <div className="absolute bottom-1/4 -left-20 w-64 h-64 bg-[#7a2e25]/10 blur-[100px] rounded-full" />

            <div className="relative z-10 max-w-5xl">
              <h1 className="text-6xl md:text-8xl font-headline font-medium tracking-tighter leading-[0.9] mb-8">
                Build hardware, <br />
                <span className="text-[#ee671c]">get funded.</span>
              </h1>

              <p className="text-lg md:text-xl text-stone-400 max-w-xl font-light leading-relaxed mb-12">
                Up to <span className="text-[#ffb595] font-medium">$2,000</span> in grants for hardware projects. For
                ages 13 to 18.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 items-start">
                <a
                  href={cta}
                  className="signature-smolder text-[#4c1a00] px-10 py-4 text-sm font-bold uppercase tracking-widest rounded-lg flex items-center gap-3 group"
                >
                  {shared.auth.user ? 'Go to Dashboard' : 'Apply for Funding'}
                  <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">
                    arrow_forward
                  </span>
                </a>
                <a
                  href="#how-it-works"
                  className="bg-[#353534] text-[#e5e2e1] px-10 py-4 text-sm font-bold uppercase tracking-widest rounded-lg ghost-border hover:bg-[#3a3939] transition-colors btn-bracket"
                >
                  How It Works
                </a>
              </div>
            </div>

            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 text-stone-600">
              <span className="text-[10px] tracking-[0.3em] uppercase">Scroll to learn more</span>
              <div className="w-[1px] h-12 bg-stone-600" />
            </div>
          </section>

          <section id="how-it-works" className="px-8 md:px-24 py-32 bg-[#0e0e0e]">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 max-w-6xl mx-auto">
              <div className="md:col-span-8 group relative overflow-hidden bg-[#1c1b1b] rounded-xl ghost-border p-12 flex flex-col justify-between min-h-[400px]">
                <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:opacity-40 transition-opacity">
                  <span className="material-symbols-outlined text-9xl">hardware</span>
                </div>
                <div>
                  <h3 className="text-3xl font-headline font-medium mb-4 text-[#ffb595]">Real Hardware Only.</h3>
                  <p className="text-stone-400 max-w-md leading-relaxed">
                    Forge is for builders who solder, 3D print, laser cut, and wire things together. Circuits, robots,
                    custom PCBs, mechanical builds - if you can hold it in your hands, it belongs here.
                  </p>
                </div>
                <div className="flex gap-4 items-center">
                  <span className="text-xs font-bold tracking-widest uppercase text-stone-500">Popular builds:</span>
                  <div className="flex gap-2">
                    <span className="px-2 py-1 bg-[#2a2a2a] text-[10px] rounded text-stone-300">PCBs</span>
                    <span className="px-2 py-1 bg-[#2a2a2a] text-[10px] rounded text-stone-300">Robotics</span>
                    <span className="px-2 py-1 bg-[#2a2a2a] text-[10px] rounded text-stone-300">3D Prints</span>
                  </div>
                </div>
              </div>

              <div className="md:col-span-4 bg-[#2a2a2a] rounded-xl ghost-border p-8 flex flex-col justify-center items-center text-center">
                <span className="text-5xl font-headline font-bold text-[#e5e2e1] mb-2">$1,000</span>
                <span className="text-xs tracking-widest uppercase text-[#ffb595] font-bold">
                  Max Grant per Project
                </span>
                <p className="text-sm text-stone-500 mt-4 px-4">Equity-free. No strings. Just build and document.</p>
              </div>

              <div className="md:col-span-4 bg-[#1c1b1b] rounded-xl ghost-border p-8 flex flex-col justify-between group hover:bg-[#2a2a2a] transition-colors">
                <div className="w-10 h-10 rounded-lg signature-smolder flex items-center justify-center">
                  <span className="material-symbols-outlined text-[#4c1a00]">verified</span>
                </div>
                <div>
                  <h4 className="font-headline font-bold uppercase tracking-tight mb-2">Expert Review</h4>
                  <p className="text-sm text-stone-400">
                    Our team reviews your project submissions and provides feedback to help you improve and get funded.
                  </p>
                </div>
              </div>

              <div className="md:col-span-8 bg-[#1c1b1b] rounded-xl ghost-border overflow-hidden flex flex-col md:flex-row">
                <div className="p-10 flex-1">
                  <h3 className="text-2xl font-headline font-medium mb-4">Document Your Build.</h3>
                  <p className="text-sm text-stone-400 leading-relaxed mb-6">
                    Ship updates as you go. Log your progress, share your process, and show the world what you're
                    building. The better you document, the more you earn.
                  </p>
                  <a
                    className="text-xs font-bold uppercase tracking-widest text-[#ffb595] flex items-center gap-2"
                    href="/explore"
                  >
                    See live projects
                    <span className="material-symbols-outlined text-sm">open_in_new</span>
                  </a>
                </div>
                <div className="w-full md:w-1/3 h-48 md:h-auto bg-[#2a2a2a] relative overflow-hidden flex items-center justify-center">
                  <span className="material-symbols-outlined text-8xl text-stone-700">description</span>
                </div>
              </div>
            </div>
          </section>

          <section className="py-40 px-8 flex flex-col items-center text-center relative">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[1px] bg-[#ffb595]/20" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-full w-[1px] bg-[#ffb595]/20" />
            </div>
            <div className="max-w-2xl relative z-10">
              <h2 className="text-4xl md:text-5xl font-headline font-medium mb-8 leading-tight">
                Ready to start <br />
                <span className="text-stone-600">building</span> something <span className="text-[#e5e2e1]">real?</span>
              </h2>
              <p className="text-stone-400 mb-12 leading-relaxed">
                Sign in with Slack to register your project and start earning. All you need is an idea and the
                willingness to build it.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <a
                  href={cta}
                  className="signature-smolder text-[#4c1a00] px-12 py-5 text-sm font-bold uppercase tracking-[0.2em] rounded-lg shadow-xl shadow-[#ee671c]/20"
                >
                  {shared.auth.user ? 'Go to Dashboard' : 'Get Started'}
                </a>
                <a
                  href="/docs"
                  className="bg-[#1c1b1b] text-[#e5e2e1] px-12 py-5 text-sm font-bold uppercase tracking-[0.2em] rounded-lg ghost-border btn-bracket"
                >
                  Read the Docs
                </a>
              </div>
            </div>
          </section>

          <footer className="border-t border-white/5 py-16 px-8 md:px-24 bg-[#0e0e0e]">
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
              <div className="flex flex-col gap-6">
                <span className="text-2xl font-bold tracking-tighter text-[#FFB595] uppercase font-headline">
                  Forge
                </span>
                <p className="text-xs text-stone-500 max-w-xs leading-loose font-light">
                  Forge is a Hack Club event where teen builders get funded for their hardware projects.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-16">
                <div className="flex flex-col gap-4">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#ffb595]">Navigate</span>
                  <a className="text-xs text-stone-500 hover:text-white transition-colors" href="/explore">
                    Explore
                  </a>
                  <a className="text-xs text-stone-500 hover:text-white transition-colors" href="/docs">
                    Resources
                  </a>
                </div>
                <div className="flex flex-col gap-4">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#ffb595]">Hack Club</span>
                  <a
                    className="text-xs text-stone-500 hover:text-white transition-colors"
                    href="https://hackclub.com"
                    target="_blank"
                    rel="noopener"
                  >
                    Website
                  </a>
                  <a
                    className="text-xs text-stone-500 hover:text-white transition-colors"
                    href="https://hackclub.com/slack"
                    target="_blank"
                    rel="noopener"
                  >
                    Slack
                  </a>
                </div>
              </div>
            </div>
            <div className="max-w-6xl mx-auto mt-24 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] tracking-widest text-stone-700 uppercase font-bold">
              <span>&copy; {new Date().getFullYear()} Forge &mdash; A Hack Club Event</span>
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500/50" />
                Systems Nominal
              </span>
            </div>
          </footer>
        </main>
      </div>
    </>
  )
}

LandingIndex.layout = (page: React.ReactNode) => page
