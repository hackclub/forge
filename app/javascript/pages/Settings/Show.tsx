import { Link, router, Head } from '@inertiajs/react'
import { useEffect, useRef, useState } from 'react'

const PFP_SIZE = 1024

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Failed to load ${src}`))
    img.src = src
  })
}

function ForgePfpSection({ avatar }: { avatar: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')

  useEffect(() => {
    let cancelled = false

    Promise.all([loadImage('/settings/avatar_proxy'), loadImage('/forge_pfp_overlay.png')])
      .then(([pfp, overlay]) => {
        if (cancelled) return
        const canvas = canvasRef.current
        const ctx = canvas?.getContext('2d')
        if (!canvas || !ctx) throw new Error('canvas unavailable')

        canvas.width = PFP_SIZE
        canvas.height = PFP_SIZE
        const scale = Math.max(PFP_SIZE / pfp.width, PFP_SIZE / pfp.height)
        const w = pfp.width * scale
        const h = pfp.height * scale
        ctx.drawImage(pfp, (PFP_SIZE - w) / 2, (PFP_SIZE - h) / 2, w, h)
        ctx.drawImage(overlay, 0, 0, PFP_SIZE, PFP_SIZE)
        setStatus('ready')
      })
      .catch(() => {
        if (!cancelled) setStatus('error')
      })

    return () => {
      cancelled = true
    }
  }, [])

  function download() {
    canvasRef.current?.toBlob((blob) => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'forge_pfp.png'
      a.click()
      URL.revokeObjectURL(url)
    }, 'image/png')
  }

  return (
    <section className="bg-[#1c1b1b] ghost-border p-6 md:p-8 mb-6">
      <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-stone-500 font-headline mb-4">Forge PFP</h2>
      <div className="flex flex-col sm:flex-row sm:items-center gap-6">
        <div className="flex items-center gap-3 shrink-0">
          <img src={avatar} alt="Current avatar" className="w-24 h-24 border border-white/10" />
          <span className="material-symbols-outlined text-stone-500">arrow_forward</span>
          <div className="relative w-24 h-24">
            <canvas ref={canvasRef} className="w-24 h-24 border border-white/10" />
            {status === 'loading' && (
              <div className="absolute inset-0 flex items-center justify-center bg-[#0e0e0e] border border-white/10">
                <span className="material-symbols-outlined text-stone-600 animate-spin text-lg">progress_activity</span>
              </div>
            )}
          </div>
        </div>
        <div className="min-w-0">
          {status === 'error' ? (
            <p className="text-stone-500 text-sm">Couldn't load your avatar. Refresh the page to try again.</p>
          ) : (
            <>
              <p className="text-stone-400 text-sm mb-4">
                Forge-ify your Slack pfp! Download it, then set it as your profile photo on Slack :D
              </p>
              <button
                onClick={download}
                disabled={status !== 'ready'}
                className="signature-smolder text-[#4c1a00] font-bold px-4 py-2 uppercase tracking-wider text-[10px] inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-default"
              >
                <span className="material-symbols-outlined text-sm">download</span>
                Download Forge PFP
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  )
}

interface Address {
  address_line1: string | null
  address_line2: string | null
  city: string | null
  state: string | null
  country: string | null
  postal_code: string | null
  phone_number: string | null
}

const IDV_LABELS: Record<string, string> = {
  needs_submission: 'Needs Submission',
  pending: 'Pending',
  verified: 'Verified',
  verified_eligible: 'Verified',
  verified_but_over_18: 'Verified (Not YSWS-Eligible)',
  verified_but_over_18_on_file: 'Verified but 18+ from birthday on file',
  ineligible: 'Ineligible',
  rejected: 'Rejected',
  not_found: 'Not Found',
}

const IDV_COLORS: Record<string, string> = {
  needs_submission: 'text-amber-400',
  pending: 'text-amber-400',
  verified: 'text-emerald-400',
  verified_eligible: 'text-emerald-400',
  verified_but_over_18: 'text-emerald-400',
  verified_but_over_18_on_file: 'text-red-400',
  ineligible: 'text-red-400',
  rejected: 'text-red-400',
  not_found: 'text-red-400',
}

interface SettingsUser {
  id: number
  display_name: string
  email: string
  avatar: string
  github_username: string | null
  git_provider: string
  timezone: string
  timezone_manually_set: boolean
}

interface TimezoneOption {
  value: string
  label: string
}

export default function SettingsShow({
  user,
  address,
  hca_address_portal_url,
  timezone_options,
  verification_status,
  idv_verified,
  hca_verify_portal_url,
}: {
  user: SettingsUser
  address: Address | null
  hca_address_portal_url: string
  timezone_options: TimezoneOption[]
  verification_status: string | null
  idv_verified: boolean
  hca_verify_portal_url: string
}) {
  const [timezone, setTimezone] = useState(user.timezone)
  const [savingTimezone, setSavingTimezone] = useState(false)

  function saveTimezone() {
    setSavingTimezone(true)
    router.patch(
      '/settings/timezone',
      { timezone },
      { preserveScroll: true, onFinish: () => setSavingTimezone(false) },
    )
  }

  function refreshAddress() {
    router.post('/profile/sync_address', {}, { preserveScroll: true })
  }

  function restartOnboarding() {
    router.post('/onboarding/restart', {}, { preserveScroll: false, preserveState: false })
  }

  return (
    <>
      <Head title="Settings - Forge" />
      <div className="p-5 md:p-12 max-w-3xl mx-auto">
        <Link
          href="/home"
          className="text-stone-500 text-sm hover:text-[#ffb595] transition-colors flex items-center gap-1 mb-8"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Back home
        </Link>

        <h1 className="text-4xl font-headline font-bold text-[#e5e2e1] tracking-tight mb-2">Settings</h1>
        <p className="text-stone-500 text-sm mb-10">Manage your Forge account.</p>

        <section className="bg-[#1c1b1b] ghost-border p-6 md:p-8 mb-6">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-stone-500 font-headline mb-4">Account</h2>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:justify-between">
            <div className="flex items-center gap-4 min-w-0">
              <img src={user.avatar} alt={user.display_name} className="w-14 h-14 border border-white/10 shrink-0" />
              <div className="min-w-0">
                <p className="text-[#e5e2e1] font-headline font-bold truncate">{user.display_name}</p>
                <p className="text-stone-500 text-xs truncate">{user.email}</p>
              </div>
            </div>
            <Link
              href={`/users/${user.id}`}
              className="ghost-border bg-[#0e0e0e] hover:bg-[#2a2a2a] text-stone-400 hover:text-[#ffb595] px-4 py-2 uppercase tracking-wider text-[10px] font-bold inline-flex items-center justify-center gap-2 transition-colors shrink-0"
            >
              <span className="material-symbols-outlined text-sm">person</span>
              View Public Profile
            </Link>
          </div>
        </section>

        <section className="bg-[#1c1b1b] ghost-border p-6 md:p-8 mb-6">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-stone-500 font-headline mb-4">Timezone</h2>
          <p className="text-stone-400 text-sm mb-5">
            Your streak day rolls over at midnight in this timezone. If it's wrong, your streak will look like it resets
            at a random time of day.
          </p>

          <div className="flex flex-col sm:flex-row gap-2">
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full bg-[#0e0e0e] border-none px-4 py-3 text-[#e5e2e1] focus:ring-1 focus:ring-[#ca5924]/30 text-sm"
            >
              {timezone_options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              onClick={saveTimezone}
              disabled={savingTimezone || timezone === user.timezone}
              className="signature-smolder text-[#4c1a00] font-bold px-5 py-3 uppercase tracking-wider text-[10px] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              <span className="material-symbols-outlined text-sm">schedule</span>
              {savingTimezone ? 'Saving...' : 'Save'}
            </button>
          </div>

          <p className="text-stone-600 text-[10px] mt-3">
            {user.timezone_manually_set
              ? 'Set by you — Forge will stop syncing this from Slack.'
              : 'Currently synced from your Slack profile. Saving a choice here takes over from that.'}
          </p>
        </section>

        <ForgePfpSection avatar={user.avatar} />

        <section className="bg-[#1c1b1b] ghost-border p-6 md:p-8">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-stone-500 font-headline">
              Shipping Address
              {address && (
                <span className="ml-2 text-emerald-400 normal-case tracking-normal text-[10px]">✓ Synced from HCA</span>
              )}
            </h2>
          </div>

          {address ? (
            <p className="text-stone-400 text-sm leading-relaxed whitespace-pre-line break-words">
              {[
                address.address_line1,
                address.address_line2,
                [address.city, address.state, address.postal_code].filter(Boolean).join(', '),
                address.country,
                address.phone_number && `☎ ${address.phone_number}`,
              ]
                .filter(Boolean)
                .join('\n')}
            </p>
          ) : (
            <p className="text-stone-500 text-sm mb-2">
              Required before submitting a project for review. Add it on your Hack Club account - we'll pull it in
              automatically.
            </p>
          )}

          <div className="mt-6 pt-6 border-t border-white/5">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-stone-500 font-headline mb-2">
              Identity Verification
            </h3>
            <p className={`text-sm font-bold mb-2 ${verification_status ? IDV_COLORS[verification_status] : 'text-stone-500'}`}>
              {verification_status ? IDV_LABELS[verification_status] || verification_status : 'Not Synced'}
            </p>
            {!idv_verified && (
              <p className="text-stone-500 text-sm mb-2">
                {verification_status === 'verified_but_over_18' &&
                  "You're verified, but Hack Club Auth's records show you're over 18."}
                {verification_status === 'verified_but_over_18_on_file' &&
                  "You're verified, but the birthday Forge has on file shows you're over 18."}
                {verification_status !== 'verified_but_over_18' &&
                  verification_status !== 'verified_but_over_18_on_file' &&
                  'Required before submitting a project for review.'}
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-2 mt-5">
            <a
              href={hca_address_portal_url}
              target="_blank"
              rel="noopener noreferrer"
              className="signature-smolder text-[#4c1a00] font-bold px-4 py-2 uppercase tracking-wider text-[10px] flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">open_in_new</span>
              Edit Address on HCA
            </a>
            {verification_status === 'needs_submission' && (
              <a
                href={hca_verify_portal_url}
                target="_blank"
                rel="noopener noreferrer"
                className="signature-smolder text-[#4c1a00] font-bold px-4 py-2 uppercase tracking-wider text-[10px] flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">verified_user</span>
                Verify on HCA
              </a>
            )}
            <button
              onClick={refreshAddress}
              className="ghost-border bg-[#0e0e0e] hover:bg-[#2a2a2a] text-stone-400 hover:text-[#ffb595] px-4 py-2 uppercase tracking-wider text-[10px] font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <span className="material-symbols-outlined text-sm">sync</span>
              Refresh from HCA
            </button>
          </div>
        </section>

        <section className="bg-[#1c1b1b] ghost-border p-6 md:p-8 mt-6">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-stone-500 font-headline mb-4">Onboarding</h2>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
            <p className="text-stone-400 text-sm">
              Want the welcome tour again? Replay Orph's walkthrough of the forge.
            </p>
            <button
              onClick={restartOnboarding}
              className="ghost-border bg-[#0e0e0e] hover:bg-[#2a2a2a] text-stone-400 hover:text-[#ffb595] px-4 py-2 uppercase tracking-wider text-[10px] font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors shrink-0"
            >
              <span className="material-symbols-outlined text-sm">replay</span>
              Restart tour
            </button>
          </div>
        </section>
      </div>
    </>
  )
}
