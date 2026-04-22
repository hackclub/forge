import { Head, Link } from '@inertiajs/react'

interface Row {
  id: number
  display_name: string
  avatar: string
  value: number
  referrals: number
  hours: number
  streak: number
}

interface Board {
  title: string
  subtitle: string
  valueLabel: string
  rows: Row[]
  emptyTitle: string
  emptyBody: string
  icon: string
  format?: (v: number) => string
}

function LeaderboardTable({
  board,
  current_user_id,
}: {
  board: Board
  current_user_id: number | null
}) {
  const format = board.format || ((v: number) => String(v))
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="material-symbols-outlined text-[#ee671c]">{board.icon}</span>
        <h2 className="text-xl font-headline font-bold text-[#e5e2e1] tracking-tight">{board.title}</h2>
      </div>
      <p className="text-stone-500 text-xs mb-4">{board.subtitle}</p>

      {board.rows.length > 0 ? (
        <div className="ghost-border divide-y divide-white/5">
          {board.rows.map((row, idx) => {
            const rank = idx + 1
            const isMe = current_user_id === row.id
            return (
              <Link
                key={row.id}
                href={`/users/${row.id}`}
                className={`flex items-center gap-3 px-4 py-2.5 hover:bg-[#1c1b1b] transition-colors group ${isMe ? 'bg-[#ee671c]/5' : ''}`}
              >
                <span className={`font-headline font-bold text-sm w-6 shrink-0 ${rank === 1 ? 'text-[#ee671c]' : rank <= 3 ? 'text-[#ffb595]' : 'text-stone-500'}`}>
                  {rank}
                </span>
                <img
                  src={row.avatar}
                  alt=""
                  className="object-cover shrink-0 border border-white/5"
                  style={{ width: 32, height: 32 }}
                />
                <span className="font-headline font-bold text-[#e5e2e1] text-sm group-hover:text-[#ffb595] transition-colors truncate flex-1 min-w-0">
                  {row.display_name}
                  {isMe && <span className="ml-1.5 text-[9px] text-[#ee671c] uppercase tracking-widest">You</span>}
                </span>
                <span className="text-[#ffb595] text-base font-headline font-bold tabular-nums shrink-0">
                  {format(row.value)}
                </span>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="bg-[#1c1b1b] ghost-border p-8 text-center">
          <p className="text-stone-300 text-sm font-headline font-medium mb-1">{board.emptyTitle}</p>
          <p className="text-stone-500 text-xs">{board.emptyBody}</p>
        </div>
      )}
    </div>
  )
}

export default function LeaderboardIndex({
  referrals,
  hours,
  streaks,
  current_user_id,
}: {
  referrals: Row[]
  hours: Row[]
  streaks: Row[]
  current_user_id: number | null
}) {
  const boards: Board[] = [
    {
      title: 'Referrals',
      subtitle: 'Top referrers in the community',
      valueLabel: 'Referrals',
      rows: referrals,
      emptyTitle: "No one's on the board yet",
      emptyBody: 'Share your referral code to be the first.',
      icon: 'group_add',
    },
    {
      title: 'Most Hours',
      subtitle: 'Most hours logged across all projects',
      valueLabel: 'Hours',
      rows: hours,
      emptyTitle: 'No hours logged yet',
      emptyBody: 'Start a project and log some devlogs.',
      icon: 'schedule',
      format: (v) => `${v}h`,
    },
    {
      title: 'Best Streak',
      subtitle: 'Longest activity streak ever recorded',
      valueLabel: 'Days',
      rows: streaks,
      emptyTitle: 'No streaks yet',
      emptyBody: 'Come back tomorrow to start one.',
      icon: 'local_fire_department',
      format: (v) => `${v}d`,
    },
  ]

  return (
    <>
      <Head title="Leaderboard - Forge" />
      <div className="p-5 md:p-12 max-w-[1400px] mx-auto">
        <div className="mb-10">
          <h1 className="text-4xl font-headline font-bold text-[#ee671c] tracking-tight">Leaderboard</h1>
          <p className="text-stone-500 text-sm mt-1">The top builders across the forge.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {boards.map((board) => (
            <LeaderboardTable key={board.title} board={board} current_user_id={current_user_id} />
          ))}
        </div>
      </div>
    </>
  )
}
