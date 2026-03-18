import { usePage, router } from '@inertiajs/react'
import type { SharedProps } from '@/types'

export default function BansShow() {
  const shared = usePage<SharedProps>().props

  function signOut(e: React.MouseEvent) {
    e.preventDefault()
    router.delete(shared.sign_out_path)
  }

  return (
    <div className="max-w-2xl mx-auto py-16 text-center">
      <h1 className="font-bold text-4xl mb-4">Account Suspended</h1>
      <p className="text-gray-600 mb-8">
        Your account has been suspended. If you believe this is a mistake, please reach out to us for assistance.
      </p>
      <button onClick={signOut} className="text-blue-600 hover:underline">
        Sign Out
      </button>
    </div>
  )
}
