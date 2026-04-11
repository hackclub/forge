import { useState } from 'react'
import { Head, router, usePage } from '@inertiajs/react'

interface ReferralRow {
  id: number
  status: 'pending' | 'eligible' | 'approved'
  display_name: string
  avatar: string
  created_at: string
}

interface Stats {
  total: number
  pending: number
  eligible: number
  approved: number
  earned: number
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Signed up',
  eligible: 'Approved (your payout is pending)',
  approved: 'Paid out',
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-stone-500/20 text-stone-400',
  eligible: 'bg-amber-500/20 text-amber-400',
  approved: 'bg-emerald-500/20 text-emerald-400',
}

export default function RsvpReferral({
  referral_code,
  referral_url,
  is_beta_approved,
  stats,
  referrals,
}: {
  referral_code: string
  referral_url: string
  is_beta_approved: boolean
  stats: Stats
  referrals: ReferralRow[]
}) {
  const [copied, setCopied] = useState(false)
  const shared = usePage().props as unknown as { sign_out_path: string }

  function signOut() {
    router.delete(shared.sign_out_path)
  }

  function copyLink() {
    navigator.clipboard.writeText(referral_url)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <>
      <Head title="Forge — Your Referral" />

      <div className="min-h-screen bg-[#0e0e0e] text-[#e5e2e1] flex flex-col">
        <nav className="flex justify-between items-center px-8 md:px-16 py-8">
          <span className="text-2xl font-bold tracking-tighter text-[#ee671c] uppercase font-headline">Forge</span>
          <button onClick={signOut} className="text-stone-500 hover:text-[#ffb595] transition-colors text-xs font-bold uppercase tracking-[0.2em] cursor-pointer">
            Sign Out
          </button>
        </nav>

        <main className="flex-1 flex flex-col items-center px-6 pb-24 pt-8">
          <div className="w-full max-w-2xl">
            {is_beta_approved && (
              <a
                href="/home"
                className="signature-smolder text-[#4c1a00] ghost-border flex items-center justify-between gap-4 p-5 mb-8 group cursor-pointer"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <span className="material-symbols-outlined text-3xl shrink-0">local_fire_department</span>
                  <div className="min-w-0">
                    <p className="font-headline font-bold uppercase tracking-[0.15em] text-sm">Congrats! You've been approved for beta</p>
                    <p className="text-[#4c1a00]/80 text-xs mt-1">Click here to get started</p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-2xl group-hover:translate-x-1 transition-transform shrink-0">arrow_forward</span>
              </a>
            )}

            <div className="text-center mb-10">
              <p className="text-[10px] uppercase tracking-[0.3em] text-[#ee671c] font-bold mb-4">You're on the waitlist</p>
              <h1 className="text-4xl md:text-5xl font-headline font-bold tracking-tighter leading-[0.95] mb-4">
                Refer a friend!
                <br />
                <span className="text-[#ee671c]">Get payed</span>
              </h1>
              <p className="text-stone-400 text-sm md:text-base max-w-lg mx-auto">
                Share your code. When they sign up and ship their first project, you earn 0.4 coins + a ticket into the prize pool draw.
              </p>
            </div>

            <div className="bg-[#1c1b1b] ghost-border p-6 md:p-8 mb-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-stone-500 mb-3">Your referral code</p>
              <div className="flex flex-col sm:flex-row gap-3 items-stretch">
                <code className="flex-1 bg-[#0e0e0e] font-mono text-2xl md:text-3xl text-[#ffb595] px-5 py-4 font-bold tracking-widest text-center">
                  {referral_code}
                </code>
                <button
                  onClick={copyLink}
                  className="signature-smolder text-[#4c1a00] px-6 py-4 font-headline font-bold uppercase tracking-[0.2em] text-sm cursor-pointer flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-lg">{copied ? 'check' : 'content_copy'}</span>
                  {copied ? 'Copied' : 'Copy Link'}
                </button>
              </div>
              <p className="text-stone-600 text-xs mt-3 break-all">{referral_url}</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <Stat label="Total" value={stats.total} />
              <Stat label="Pending" value={stats.pending} />
              <Stat label="Shipped" value={stats.eligible} accent />
              <Stat label="Earned" value={`${stats.earned.toFixed(2)}c`} accent />
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-stone-500 mb-3">Your referrals</p>
              {referrals.length === 0 ? (
                <div className="bg-[#1c1b1b] ghost-border p-10 text-center">
                  <p className="text-stone-400 text-sm">No one's signed up with your code yet. Share it!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {referrals.map((r) => (
                    <div key={r.id} className="bg-[#1c1b1b] ghost-border px-4 py-3 flex items-center gap-3">
                      <img src={r.avatar} alt="" className="w-8 h-8 object-cover" />
                      <div className="flex-1 min-w-0">
                        <p className="font-headline font-bold text-[#e5e2e1] text-sm truncate">{r.display_name}</p>
                        <p className="text-stone-600 text-xs">{r.created_at}</p>
                      </div>
                      <span className={`px-3 py-1 text-[9px] font-bold uppercase tracking-wider ${STATUS_STYLES[r.status]}`}>
                        {STATUS_LABEL[r.status]}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  )
}

function Stat({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className={`ghost-border bg-[#1c1b1b] p-4 ${accent ? 'border border-[#ee671c]/30' : ''}`}>
      <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-500 mb-2">{label}</p>
      <p className={`font-headline font-bold text-xl ${accent ? 'text-[#ffb595]' : 'text-[#e5e2e1]'}`}>{value}</p>
    </div>
  )
}

RsvpReferral.layout = (page: React.ReactNode) => page
