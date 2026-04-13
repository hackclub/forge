import { Link, router, Head } from '@inertiajs/react'

interface Address {
  address_line1: string | null
  address_line2: string | null
  city: string | null
  state: string | null
  country: string | null
  postal_code: string | null
  phone_number: string | null
}

interface SettingsUser {
  id: number
  display_name: string
  email: string
  avatar: string
  github_username: string | null
  git_provider: string
}

export default function SettingsShow({
  user,
  address,
  hca_address_portal_url,
}: {
  user: SettingsUser
  address: Address | null
  hca_address_portal_url: string
}) {
  function refreshAddress() {
    router.post('/profile/sync_address', {}, { preserveScroll: true })
  }

  return (
    <>
      <Head title="Settings — Forge" />
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
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-stone-500 font-headline mb-4">
            Account
          </h2>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:justify-between">
            <div className="flex items-center gap-4 min-w-0">
              <img
                src={user.avatar}
                alt={user.display_name}
                className="w-14 h-14 border border-white/10 shrink-0"
              />
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

        <section className="bg-[#1c1b1b] ghost-border p-6 md:p-8">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-stone-500 font-headline">
              Shipping Address
              {address && (
                <span className="ml-2 text-emerald-400 normal-case tracking-normal text-[10px]">
                  ✓ Synced from HCA
                </span>
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
              Required before submitting a project for review. Add it on your Hack Club account — we'll pull it
              in automatically.
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-2 mt-5">
            <a
              href={hca_address_portal_url}
              target="_blank"
              rel="noopener noreferrer"
              className="signature-smolder text-[#4c1a00] font-bold px-4 py-2 uppercase tracking-wider text-[10px] flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">open_in_new</span>
              {address ? 'Edit on HCA' : 'Add Address on HCA'}
            </a>
            <button
              onClick={refreshAddress}
              className="ghost-border bg-[#0e0e0e] hover:bg-[#2a2a2a] text-stone-400 hover:text-[#ffb595] px-4 py-2 uppercase tracking-wider text-[10px] font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <span className="material-symbols-outlined text-sm">sync</span>
              Refresh from HCA
            </button>
          </div>
        </section>
      </div>
    </>
  )
}
