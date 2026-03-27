import { Head } from '@inertiajs/react'

export default function ShopIndex() {
  return (
    <>
      <Head title="Shop — Forge" />
      <div className="p-12 max-w-[1400px] mx-auto">
        {/* Header */}
        <section className="mb-12">
          <h1 className="font-headline text-5xl font-medium tracking-tight mb-4 text-[#e5e2e1]">
            The <span className="text-[#ffb595] italic">Shop</span>
          </h1>
          <p className="text-stone-400 leading-relaxed max-w-2xl">
            Spend your earned heat on tools, components, and resources for your next build.
          </p>
        </section>

        {/* Coming Soon */}
        <div className="bg-[#1c1b1b] rounded-xl ghost-border p-16 text-center max-w-2xl mx-auto">
          <div className="w-16 h-16 rounded-xl signature-smolder flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-[#4c1a00] text-3xl">local_fire_department</span>
          </div>
          <h2 className="text-2xl font-headline font-bold text-white mb-3">Shop Coming Soon</h2>
          <p className="text-stone-400 text-sm leading-relaxed mb-8 max-w-md mx-auto">
            The shop is being stocked with components, tools, and resources you can acquire with your earned heat. Keep building and voting to accumulate heat in the meantime.
          </p>
          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center gap-2 bg-[#201f1f] px-4 py-2 rounded-full ghost-border">
              <span className="material-symbols-outlined text-[#ffb595] text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
              <span className="font-headline font-bold text-sm">0 <span className="text-[10px] text-stone-500">HEAT</span></span>
            </div>
            <span className="text-stone-600 text-xs">Your balance</span>
          </div>
        </div>
      </div>
    </>
  )
}
