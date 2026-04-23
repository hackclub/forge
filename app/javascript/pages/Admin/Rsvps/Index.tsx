import { useState } from 'react'
import { router } from '@inertiajs/react'
import Pagination from '@/components/Pagination'
import type { PagyProps } from '@/types'

interface RsvpRow {
  id: number
  email: string
  created_at: string
}

export default function AdminRsvpsIndex({
  rsvps,
  pagy,
  query,
  total,
}: {
  rsvps: RsvpRow[]
  pagy: PagyProps
  query: string
  total: number
}) {
  const [searchQuery, setSearchQuery] = useState(query)

  function search(e: React.FormEvent) {
    e.preventDefault()
    router.get('/admin/rsvps', { query: searchQuery }, { preserveState: true })
  }

  function remove(id: number, email: string) {
    if (!confirm(`Remove ${email} from the RSVP list?`)) return
    router.delete(`/admin/rsvps/${id}`)
  }

  return (
    <div className="p-5 md:p-12 max-w-[1400px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-headline font-bold text-[#e5e2e1] tracking-tight">RSVPs</h1>
          <p className="text-stone-500 text-sm mt-1">
            {total} email{total === 1 ? '' : 's'} on the waitlist
          </p>
        </div>
        <div className="flex gap-3 items-center">
          <form onSubmit={search} className="flex gap-2">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by email"
              className="bg-[#0e0e0e] border-none px-4 py-2 text-sm text-[#e5e2e1] focus:ring-1 focus:ring-[#ee671c]/30 placeholder:text-stone-600 w-64"
            />
            <button
              type="submit"
              className="ghost-border bg-[#1c1b1b] text-stone-400 hover:bg-[#2a2a2a] hover:text-[#e5e2e1] px-4 py-2 text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors"
            >
              Search
            </button>
          </form>
          <a
            href="/admin/rsvps/export"
            className="signature-smolder text-[#4c1a00] px-5 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            Export CSV
          </a>
        </div>
      </div>

      {rsvps.length > 0 ? (
        <>
          <div className="ghost-border overflow-x-auto">
            <table className="w-full min-w-[560px]">
              <thead>
                <tr className="border-b border-white/5 bg-[#1c1b1b]">
                  <th className="text-left px-5 py-3 text-[10px] uppercase tracking-[0.2em] font-bold text-stone-600">
                    Email
                  </th>
                  <th className="text-left px-5 py-3 text-[10px] uppercase tracking-[0.2em] font-bold text-stone-600">
                    Submitted
                  </th>
                  <th className="text-right px-5 py-3 text-[10px] uppercase tracking-[0.2em] font-bold text-stone-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {rsvps.map((rsvp) => (
                  <tr key={rsvp.id} className="border-b border-white/5 hover:bg-[#1c1b1b] transition-colors">
                    <td className="px-5 py-3 text-[#e5e2e1] text-sm font-mono">{rsvp.email}</td>
                    <td className="px-5 py-3 text-stone-500 text-sm">{rsvp.created_at}</td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => remove(rsvp.id, rsvp.email)}
                        className="text-stone-600 hover:text-red-400 transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination pagy={pagy} />
        </>
      ) : (
        <div className="bg-[#1c1b1b] ghost-border p-16 text-center">
          <span className="material-symbols-outlined text-5xl text-stone-700 mb-4">mark_email_unread</span>
          <p className="text-stone-300 text-lg font-headline font-medium mb-2">
            {query ? 'No matches' : 'No RSVPs yet'}
          </p>
          <p className="text-stone-500 text-sm">
            {query ? 'Try a different search.' : 'Emails will appear here as people sign up on the landing page.'}
          </p>
        </div>
      )}
    </div>
  )
}
