import { Head, Link } from '@inertiajs/react'

interface Row {
  id: number
  display_name: string
  avatar: string
  value: number
}

export default function LeaderboardIndex({
  rows,
  current_user_id,
}: {
  rows: Row[]
  current_user_id: number | null
}) {
  return (
    <>
      <Head title="Leaderboard — Forge" />
      <div className="p-5 md:p-12 max-w-[1100px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-headline font-bold text-[#ee671c] tracking-tight">Referral Leaderboard</h1>
            <p className="text-stone-500 text-sm mt-1">Top referrals in the community</p>
          </div>
        </div>

        {rows.length > 0 ? (
          <div className="ghost-border overflow-x-auto">
            <table className="w-full min-w-[560px]">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-5 py-3 text-[10px] uppercase tracking-[0.2em] font-bold text-stone-600 w-16">Rank</th>
                  <th className="text-left px-5 py-3 text-[10px] uppercase tracking-[0.2em] font-bold text-stone-600">Builder</th>
                  <th className="text-right px-5 py-3 text-[10px] uppercase tracking-[0.2em] font-bold text-stone-600">Referrals</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => {
                  const rank = idx + 1
                  const isMe = current_user_id === row.id
                  return (
                    <tr key={row.id} className={`border-b border-white/5 hover:bg-[#1c1b1b] transition-colors ${isMe ? 'bg-[#ee671c]/5' : ''}`}>
                      <td className="px-5 py-3">
                        <span className={`font-headline font-bold text-sm ${rank === 1 ? 'text-[#ee671c]' : rank <= 3 ? 'text-[#ffb595]' : 'text-stone-500'}`}>
                          {rank}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <Link href={`/users/${row.id}`} className="flex items-center gap-3 group">
                          <img src={row.avatar} alt="" width={28} height={28} className="object-cover shrink-0" style={{ width: 28, height: 28 }} />
                          <span className="font-headline font-bold text-[#e5e2e1] text-sm group-hover:text-[#ffb595] transition-colors truncate">
                            {row.display_name}
                            {isMe && <span className="ml-2 text-[9px] text-[#ee671c] uppercase tracking-widest">You</span>}
                          </span>
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-right text-stone-400 text-sm font-mono">{row.value}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-[#1c1b1b] ghost-border p-16 text-center">
            <p className="text-stone-300 text-lg font-headline font-medium mb-2">No one's on the board yet</p>
            <p className="text-stone-500 text-sm">Share your referral code to be the first.</p>
          </div>
        )}
      </div>
    </>
  )
}
