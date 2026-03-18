import { Head } from '@inertiajs/react'

export default function ShopIndex() {
  return (
    <>
      <Head title="Shop — Quarry" />
      <div className="max-w-4xl mx-auto px-6 py-10">
        <p className="text-yellow-700/60 text-[10px] uppercase tracking-[0.4em] font-bold mb-2">The Toolbag</p>
        <h1 className="text-3xl font-black text-yellow-100/90 tracking-tight mb-2">Shop</h1>
        <p className="text-yellow-100/25 text-sm mb-12">Spend your earnings on tools and components.</p>

        <div className="border border-yellow-800/20 bg-yellow-950/10 p-12 text-center">
          <p className="text-yellow-100/30 text-lg font-bold mb-2">Coming Soon</p>
          <p className="text-yellow-100/15 text-sm">The shop is being stocked. Check back later.</p>
        </div>
      </div>
    </>
  )
}
