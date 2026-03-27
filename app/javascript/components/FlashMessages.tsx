import { usePage } from '@inertiajs/react'
import type { SharedProps } from '@/types'

export default function FlashMessages() {
  const { flash } = usePage<SharedProps>().props

  if (!flash.notice && !flash.alert) return null

  return (
    <div className="px-12 pt-6">
      {flash.notice && (
        <div className="ghost-border bg-emerald-500/10 text-emerald-400 px-4 py-3 text-sm rounded-lg mb-2 flex items-center gap-2">
          <span className="material-symbols-outlined text-lg">check_circle</span>
          {flash.notice}
        </div>
      )}
      {flash.alert && (
        <div className="ghost-border bg-red-500/10 text-red-400 px-4 py-3 text-sm rounded-lg mb-2 flex items-center gap-2">
          <span className="material-symbols-outlined text-lg">error</span>
          {flash.alert}
        </div>
      )}
    </div>
  )
}
