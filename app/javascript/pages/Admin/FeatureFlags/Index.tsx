import { useState } from 'react'
import { router } from '@inertiajs/react'

interface Flag {
  id: number
  name: string
  description: string | null
  enabled: boolean
  updated_at: string
}

export default function AdminFeatureFlagsIndex({ flags }: { flags: Flag[] }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [showForm, setShowForm] = useState(false)

  function createFlag(e: React.FormEvent) {
    e.preventDefault()
    router.post('/admin/feature_flags', { feature_flag: { name, description, enabled: false } })
    setName('')
    setDescription('')
    setShowForm(false)
  }

  function toggle(id: number) {
    router.post(`/admin/feature_flags/${id}/toggle`)
  }

  function destroy(id: number, flagName: string) {
    if (!confirm(`Delete flag "${flagName}"?`)) return
    router.delete(`/admin/feature_flags/${id}`)
  }

  return (
    <div className="p-12 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-headline font-bold text-[#e5e2e1] tracking-tight">Feature Flags</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="signature-smolder text-[#4c1a00] px-6 py-3 font-bold uppercase tracking-wider text-xs flex items-center gap-2 cursor-pointer"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          New Flag
        </button>
      </div>

      {showForm && (
        <form onSubmit={createFlag} className="ghost-border bg-[#1c1b1b] p-6 mb-8 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-[0.2em] text-stone-500 mb-2">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#0e0e0e] border-none px-4 py-3 text-[#e5e2e1] focus:ring-1 focus:ring-[#ee671c]/30 placeholder:text-stone-600 text-sm"
              placeholder="e.g. new_feature_enabled"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-[0.2em] text-stone-500 mb-2">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#0e0e0e] border-none px-4 py-3 text-[#e5e2e1] focus:ring-1 focus:ring-[#ee671c]/30 placeholder:text-stone-600 text-sm"
              placeholder="What does this flag control?"
            />
          </div>
          <div className="flex gap-3">
            <button type="submit" className="signature-smolder text-[#4c1a00] px-6 py-3 font-bold uppercase tracking-wider text-xs cursor-pointer">
              Create
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="ghost-border text-stone-400 px-6 py-3 text-xs font-bold uppercase tracking-wider cursor-pointer">
              Cancel
            </button>
          </div>
        </form>
      )}

      {flags.length > 0 ? (
        <div className="ghost-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-5 py-3 text-[10px] uppercase tracking-[0.2em] font-bold text-stone-600">Flag</th>
                <th className="text-left px-5 py-3 text-[10px] uppercase tracking-[0.2em] font-bold text-stone-600">Description</th>
                <th className="text-left px-5 py-3 text-[10px] uppercase tracking-[0.2em] font-bold text-stone-600">Status</th>
                <th className="text-left px-5 py-3 text-[10px] uppercase tracking-[0.2em] font-bold text-stone-600">Updated</th>
                <th className="text-right px-5 py-3 text-[10px] uppercase tracking-[0.2em] font-bold text-stone-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {flags.map((flag) => (
                <tr key={flag.id} className="border-b border-white/5 hover:bg-[#1c1b1b] transition-colors">
                  <td className="px-5 py-4 font-headline font-bold text-[#e5e2e1] text-sm">{flag.name}</td>
                  <td className="px-5 py-4 text-stone-500 text-sm">{flag.description || '—'}</td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => toggle(flag.id)}
                      className={`px-3 py-1 text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors ${
                        flag.enabled
                          ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                          : 'bg-stone-500/20 text-stone-500 hover:bg-stone-500/30'
                      }`}
                    >
                      {flag.enabled ? 'Enabled' : 'Disabled'}
                    </button>
                  </td>
                  <td className="px-5 py-4 text-stone-500 text-xs">{flag.updated_at}</td>
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => destroy(flag.id, flag.name)}
                      className="text-red-400/50 hover:text-red-400 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="ghost-border bg-[#1c1b1b] p-16 text-center">
          <p className="text-stone-300 text-lg font-headline font-medium mb-2">No feature flags</p>
          <p className="text-stone-500 text-sm">Create one to get started.</p>
        </div>
      )}
    </div>
  )
}
