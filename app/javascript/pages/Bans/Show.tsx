import { usePage, router } from '@inertiajs/react'
import type { SharedProps } from '@/types'

export default function BansShow({ ban_reason }: { ban_reason: string | null }) {
  const shared = usePage<SharedProps>().props

  function signOut(e: React.MouseEvent) {
    e.preventDefault()
    router.delete(shared.sign_out_path)
  }

  return (
    <div className="min-h-screen bg-[#0E0E0E] flex items-center justify-center">
      <div className="max-w-md text-center p-12">
        <span className="material-symbols-outlined text-6xl text-red-500/50 mb-6">block</span>
        <h1 className="font-headline font-bold text-3xl text-[#e5e2e1] mb-4">Account Suspended</h1>
        <p className="text-stone-400 mb-6 leading-relaxed">
          Your account has been suspended. If you believe this is a mistake, please reach out to us for assistance.
        </p>
        {ban_reason && (
          <div className="border border-red-500/20 bg-red-500/5 p-4 mb-8 text-left">
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-red-400/60">Reason</span>
            <p className="text-stone-300 text-sm mt-1">{ban_reason}</p>
          </div>
        )}
        <button
          onClick={signOut}
          className="text-[#ffb595] hover:text-[#ee671c] text-sm font-bold uppercase tracking-widest transition-colors"
        >
          Sign Out
        </button>
      </div>
    </div>
  )
}
