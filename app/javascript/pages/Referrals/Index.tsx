import { useState } from 'react'
import { Head } from '@inertiajs/react'

interface ReferralRow {
  id: number
  status: 'pending' | 'eligible' | 'approved'
  display_name: string
  avatar: string
  created_at: string
  payout: number | null
}

interface Stats {
  total: number
  pending: number
  eligible: number
  approved: number
  earned: number
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Signed Up',
  eligible: 'Approved (payout pending)',
  approved: 'Paid Out',
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'text-stone-400',
  eligible: 'text-amber-400',
  approved: 'text-emerald-400',
}

export default function ReferralsIndex({
  referral_code,
  referral_url,
  stats,
  referrals,
}: {
  referral_code: string
  referral_url: string
  stats: Stats
  referrals: ReferralRow[]
}) {
  const [copied, setCopied] = useState(false)

  function copyLink() {
    navigator.clipboard.writeText(referral_url)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <>
      <Head title="Referrals - Forge" />
      <div className="p-5 md:p-12 max-w-[1100px] mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-headline font-bold text-[#ee671c] tracking-tight">Referrals</h1>
          <p className="text-stone-500 text-sm mt-1">
            Share your code. When they ship their first project, you earn 0.25 coins + a prize pool ticket.
          </p>
        </div>

        <div className="ghost-border bg-[#1c1b1b] p-6 md:p-8 mb-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-stone-500 mb-3">Your referral link</p>
          <div className="flex flex-col sm:flex-row gap-3 items-stretch">
            <code className="flex-1 bg-[#0e0e0e] font-mono text-xl md:text-2xl text-[#ffb595] px-5 py-4 font-bold tracking-widest text-center">
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

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <Stat label="Total" value={stats.total} />
          <Stat label="Pending" value={stats.pending} />
          <Stat label="Approved" value={stats.eligible + stats.approved} />
          <Stat label="Earned" value={`${stats.earned.toFixed(2)}c`} accent />
        </div>

        <div className="mb-3">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.25em] text-stone-500">Your Referrals</h2>
        </div>

        {referrals.length > 0 ? (
          <div className="ghost-border overflow-x-auto">
            <table className="w-full min-w-[560px]">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-5 py-3 text-[10px] uppercase tracking-[0.2em] font-bold text-stone-600">
                    Builder
                  </th>
                  <th className="text-left px-5 py-3 text-[10px] uppercase tracking-[0.2em] font-bold text-stone-600">
                    Status
                  </th>
                  <th className="text-left px-5 py-3 text-[10px] uppercase tracking-[0.2em] font-bold text-stone-600">
                    Joined
                  </th>
                  <th className="text-right px-5 py-3 text-[10px] uppercase tracking-[0.2em] font-bold text-stone-600">
                    Payout
                  </th>
                </tr>
              </thead>
              <tbody>
                {referrals.map((r) => (
                  <tr key={r.id} className="border-b border-white/5 hover:bg-[#1c1b1b] transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={r.avatar}
                          alt=""
                          width={28}
                          height={28}
                          className="object-cover shrink-0"
                          style={{ width: 28, height: 28 }}
                        />
                        <span className="font-headline font-bold text-[#e5e2e1] text-sm truncate">
                          {r.display_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`${STATUS_STYLES[r.status]} text-xs font-bold uppercase tracking-wider`}>
                        {STATUS_LABEL[r.status]}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-stone-500 text-xs">{r.created_at}</td>
                    <td className="px-5 py-3 text-right font-mono text-sm">
                      {r.payout != null ? (
                        <span className="text-[#ffb595]">+{r.payout.toFixed(2)}c</span>
                      ) : (
                        <span className="text-stone-600">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-[#1c1b1b] ghost-border p-16 text-center">
            <p className="text-stone-300 text-lg font-headline font-medium mb-2">No referrals yet</p>
            <p className="text-stone-500 text-sm">Share your link above to get started.</p>
          </div>
        )}
      </div>
    </>
  )
}

function Stat({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className={`ghost-border bg-[#1c1b1b] p-4 ${accent ? 'border border-[#ee671c]/30' : ''}`}>
      <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-500 mb-2">{label}</p>
      <p className={`font-headline font-bold text-2xl ${accent ? 'text-[#ffb595]' : 'text-[#e5e2e1]'}`}>{value}</p>
    </div>
  )
}
