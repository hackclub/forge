import { Head, Link } from '@inertiajs/react'

interface Row {
  id: number
  display_name: string
  avatar: string
  value: number
  hours: number
  streak: number
}

interface GuildRow {
  name: string
  icon: string
  value: number
}

const GUILD_ACCENT: Record<string, string> = {
  rivendell: 'text-emerald-300',
  erebor: 'text-amber-300',
  edoras: 'text-yellow-200',
  valinor: 'text-violet-200',
}

function GuildLeaderboardTable({ rows, mine }: { rows: GuildRow[]; mine: string | null }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="material-symbols-outlined text-[#ca5924]">shield</span>
          <h2 className="text-xl font-headline font-bold text-[#e5e2e1] tracking-tight truncate">Guild Referrals</h2>
        </div>
        <Link
          href="/guilds/leaderboard"
          className="shrink-0 ghost-border bg-[#1c1b1b] hover:bg-[#2a2a2a] text-stone-400 hover:text-[#ffb595] px-3 py-1.5 uppercase tracking-wider text-[10px] font-bold flex items-center gap-1.5 transition-colors"
        >
          View page
          <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </Link>
      </div>
      <p className="text-stone-500 text-xs mb-4">Which house is bringing in the most builders.</p>
      <div className="ghost-border divide-y divide-white/5">
        {rows.map((row, idx) => {
          const isMine = mine === row.name
          return (
            <Link
              key={row.name}
              href={`/guilds/${row.name}`}
              className={`flex items-center gap-3 px-4 py-2.5 hover:bg-[#1c1b1b] transition-colors group ${isMine ? 'bg-[#ca5924]/5' : ''}`}
            >
              <span
                className={`font-headline font-bold text-sm w-6 shrink-0 ${idx === 0 ? 'text-[#ca5924]' : idx < 3 ? 'text-[#ffb595]' : 'text-stone-500'}`}
              >
                {idx + 1}
              </span>
              <span
                className={`material-symbols-outlined text-2xl shrink-0 ${GUILD_ACCENT[row.name] || 'text-[#ca5924]'}`}
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                {row.icon}
              </span>
              <span className="font-headline font-bold text-[#e5e2e1] text-sm capitalize group-hover:text-[#ffb595] transition-colors truncate flex-1 min-w-0">
                {row.name}
                {isMine && <span className="ml-1.5 text-[9px] text-[#ca5924] uppercase tracking-widest">Yours</span>}
              </span>
              <span className="text-[#ffb595] text-base font-headline font-bold tabular-nums shrink-0">
                {row.value}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
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
  actionHref?: string
  actionLabel?: string
}

function LeaderboardTable({ board, current_user_id }: { board: Board; current_user_id: number | null }) {
  const format = board.format || ((v: number) => String(v))
  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="material-symbols-outlined text-[#ca5924]">{board.icon}</span>
          <h2 className="text-xl font-headline font-bold text-[#e5e2e1] tracking-tight truncate">{board.title}</h2>
        </div>
        {board.actionHref && (
          <Link
            href={board.actionHref}
            className="shrink-0 ghost-border bg-[#1c1b1b] hover:bg-[#2a2a2a] text-stone-400 hover:text-[#ffb595] px-3 py-1.5 uppercase tracking-wider text-[10px] font-bold flex items-center gap-1.5 transition-colors"
          >
            {board.actionLabel}
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
        )}
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
                className={`flex items-center gap-3 px-4 py-2.5 hover:bg-[#1c1b1b] transition-colors group ${isMe ? 'bg-[#ca5924]/5' : ''}`}
              >
                <span
                  className={`font-headline font-bold text-sm w-6 shrink-0 ${rank === 1 ? 'text-[#ca5924]' : rank <= 3 ? 'text-[#ffb595]' : 'text-stone-500'}`}
                >
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
                  {isMe && <span className="ml-1.5 text-[9px] text-[#ca5924] uppercase tracking-widest">You</span>}
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
  guild_referrals,
  mine_guild,
  hours,
  streaks,
  current_user_id,
}: {
  guild_referrals: GuildRow[]
  mine_guild: string | null
  hours: Row[]
  streaks: Row[]
  current_user_id: number | null
}) {
  const boards: Board[] = [
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
      title: 'Current Streak',
      subtitle: 'Active journaling streaks right now',
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
          <h1 className="text-4xl font-headline font-bold text-[#ca5924] tracking-tight">Leaderboard</h1>
          <p className="text-stone-500 text-sm mt-1">The top builders across the forge.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <GuildLeaderboardTable rows={guild_referrals} mine={mine_guild} />
          {boards.map((board) => (
            <LeaderboardTable key={board.title} board={board} current_user_id={current_user_id} />
          ))}
        </div>
      </div>
    </>
  )
}
