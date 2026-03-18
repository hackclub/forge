import type { ReactNode } from 'react'
import Nav from '@/components/Nav'
import FlashMessages from '@/components/FlashMessages'

export default function DefaultLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className="min-h-screen text-white"
      style={{
        backgroundColor: '#0e0c09',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='400' height='400' filter='url(%23n)' opacity='0.06'/%3E%3C/svg%3E")`,
      }}
    >
      <Nav />
      <div className="ml-52">
        <FlashMessages />
        <main>{children}</main>
      </div>
    </div>
  )
}
