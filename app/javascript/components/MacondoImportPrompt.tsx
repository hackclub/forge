import { useState } from 'react'
import { router } from '@inertiajs/react'
import type { MacondoImport, ProjectTier } from '@/types'
import { TIER_OPTIONS, tierCoinRate } from '@/lib/tiers'

export default function MacondoImportPrompt({
  projectId,
  macondoImport,
}: {
  projectId: number
  macondoImport: MacondoImport
}) {
  const [tier, setTier] = useState<ProjectTier | null>(null)
  const [saving, setSaving] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  const options = TIER_OPTIONS.filter((option) => macondoImport.selectable_tiers.includes(option.tier))
  const highestLabel = options.find((option) => option.tier === macondoImport.selectable_tiers[0])?.label

  function confirmTier() {
    if (!tier) return
    setSaving(true)
    router.post(`/projects/${projectId}/confirm_macondo_tier`, { tier }, { onFinish: () => setSaving(false) })
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1c1b1b] ghost-border max-w-2xl w-full p-8 space-y-6 max-h-[90vh] overflow-y-auto">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-500 mb-2">Imported from Macondo</p>
          <h3 className="text-2xl font-headline font-bold text-[#e5e2e1] tracking-tight mb-3">
            Hey! Your projects were imported automatically from Macondo, but we need some more details from you
          </h3>
          <p className="text-stone-400 text-sm leading-relaxed">
            Pick the Forge tier for this project. Forge tiers run the other way round to Macondo's — here tier 1 is the
            most ambitious, and each tier earns a different rate of steel coins per hour you log.
          </p>
        </div>

        {macondoImport.tier && (
          <div className="bg-[#0e0e0e] p-4 text-sm text-stone-400">
            On Macondo you picked <span className="text-[#ffb595] font-bold">Tier {macondoImport.tier}</span>
            {highestLabel && <> — on Forge that's up to {highestLabel}.</>}
          </div>
        )}

        <div className="space-y-3">
          {options.map((option) => (
            <button
              key={option.tier}
              type="button"
              onClick={() => setTier(option.tier)}
              className={`w-full text-left p-4 transition-colors cursor-pointer ${
                tier === option.tier
                  ? 'bg-[#2a2a2a] border border-[#ca5924]/40'
                  : 'bg-[#0e0e0e] ghost-border hover:bg-[#2a2a2a]'
              }`}
            >
              <div className="flex items-center gap-3 mb-1">
                <span className="font-headline font-bold text-[#e5e2e1]">{option.label}</span>
                <span className="text-xs font-bold uppercase tracking-[0.15em] text-[#ca5924]">
                  {tierCoinRate(option.tier)}
                </span>
              </div>
              <p className="text-stone-400 text-sm leading-relaxed">{option.description}</p>
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={confirmTier}
            disabled={!tier || saving}
            className="flex-1 signature-smolder text-[#4c1a00] font-headline font-bold py-3 uppercase tracking-wider text-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-95 transition-transform"
          >
            {saving ? 'Confirming…' : 'Confirm Tier'}
          </button>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="ghost-border bg-[#0e0e0e] hover:bg-[#2a2a2a] text-stone-400 px-5 py-3 text-sm font-headline font-bold uppercase tracking-wider cursor-pointer transition-colors"
          >
            Later
          </button>
        </div>
      </div>
    </div>
  )
}
