import type { ReactNode } from 'react'
import Nav from '@/components/Nav'
import FlashMessages from '@/components/FlashMessages'

export default function DefaultLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0E0E0E] text-[#e5e2e1]">
      <Nav />
      <main className="md:ml-64 min-h-screen pt-14 md:pt-0">
        <FlashMessages />
        {children}
      </main>
    </div>
  )
}
