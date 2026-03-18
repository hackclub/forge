import { usePage } from '@inertiajs/react'
import type { SharedProps } from '@/types'

export default function FlashMessages() {
  const { flash } = usePage<SharedProps>().props

  if (!flash.notice && !flash.alert) return null

  return (
    <div className="px-6 pt-4">
      {flash.notice && (
        <div className="border border-green-800/30 bg-green-950/20 text-green-400/80 px-4 py-3 text-sm mb-2">
          {flash.notice}
        </div>
      )}
      {flash.alert && (
        <div className="border border-red-800/30 bg-red-950/20 text-red-400/80 px-4 py-3 text-sm mb-2">
          {flash.alert}
        </div>
      )}
    </div>
  )
}
