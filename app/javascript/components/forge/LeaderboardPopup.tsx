import { Link } from '@inertiajs/react'
import { ForgeLoading, useForgeData } from './useForgeData'

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

interface LeaderboardData {
  guild_referrals: GuildRow[]
  mine_guild: string | null
  hours: Row[]
  streaks: Row[]
  current_user_id: number | null
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
      <div className="mb-3 flex items-center gap-2">
        <span className="material-symbols-outlined text-[#ca5924]">shield</span>
        <h3 className="truncate font-headline text-lg font-bold tracking-tight text-[#e5e2e1]">Guild Referrals</h3>
      </div>
      <p className="mb-4 text-xs text-stone-500">Which house is bringing in the most builders.</p>
      <div className="divide-y divide-white/5 ghost-border">
        {rows.map((row, idx) => {
          const isMine = mine === row.name
          return (
            <Link
              key={row.name}
              href={`/guilds/${row.name}`}
              className={`group flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-[#1c1b1b] ${isMine ? 'bg-[#ca5924]/5' : ''}`}
            >
              <span
                className={`w-6 shrink-0 font-headline text-sm font-bold ${idx === 0 ? 'text-[#ca5924]' : idx < 3 ? 'text-[#ffb595]' : 'text-stone-500'}`}
              >
                {idx + 1}
              </span>
              <span
                className={`material-symbols-outlined shrink-0 text-2xl ${GUILD_ACCENT[row.name] || 'text-[#ca5924]'}`}
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                {row.icon}
              </span>
              <span className="min-w-0 flex-1 truncate font-headline text-sm font-bold capitalize text-[#e5e2e1] transition-colors group-hover:text-[#ffb595]">
                {row.name}
                {isMine && <span className="ml-1.5 text-[9px] uppercase tracking-widest text-[#ca5924]">Yours</span>}
              </span>
              <span className="shrink-0 font-headline text-base font-bold tabular-nums text-[#ffb595]">
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
  rows: Row[]
  emptyTitle: string
  emptyBody: string
  icon: string
  format: (v: number) => string
}

function LeaderboardTable({ board, currentUserId }: { board: Board; currentUserId: number | null }) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <span className="material-symbols-outlined text-[#ca5924]">{board.icon}</span>
        <h3 className="truncate font-headline text-lg font-bold tracking-tight text-[#e5e2e1]">{board.title}</h3>
      </div>
      <p className="mb-4 text-xs text-stone-500">{board.subtitle}</p>

      {board.rows.length > 0 ? (
        <div className="divide-y divide-white/5 ghost-border">
          {board.rows.map((row, idx) => {
            const rank = idx + 1
            const isMe = currentUserId === row.id
            return (
              <Link
                key={row.id}
                href={`/users/${row.id}`}
                className={`group flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-[#1c1b1b] ${isMe ? 'bg-[#ca5924]/5' : ''}`}
              >
                <span
                  className={`w-6 shrink-0 font-headline text-sm font-bold ${rank === 1 ? 'text-[#ca5924]' : rank <= 3 ? 'text-[#ffb595]' : 'text-stone-500'}`}
                >
                  {rank}
                </span>
                <img
                  src={row.avatar}
                  alt=""
                  className="shrink-0 border border-white/5 object-cover"
                  style={{ width: 32, height: 32 }}
                />
                <span className="min-w-0 flex-1 truncate font-headline text-sm font-bold text-[#e5e2e1] transition-colors group-hover:text-[#ffb595]">
                  {row.display_name}
                  {isMe && <span className="ml-1.5 text-[9px] uppercase tracking-widest text-[#ca5924]">You</span>}
                </span>
                <span className="shrink-0 font-headline text-base font-bold tabular-nums text-[#ffb595]">
                  {board.format(row.value)}
                </span>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="bg-[#1c1b1b] p-8 text-center ghost-border">
          <p className="mb-1 font-headline text-sm font-medium text-stone-300">{board.emptyTitle}</p>
          <p className="text-xs text-stone-500">{board.emptyBody}</p>
        </div>
      )}
    </div>
  )
}

export default function LeaderboardPopup() {
  const { data } = useForgeData<LeaderboardData>('leaderboard')
  if (!data) return <ForgeLoading />

  const boards: Board[] = [
    {
      title: 'Most Hours',
      subtitle: 'Most hours logged across all projects',
      rows: data.hours,
      emptyTitle: 'No hours logged yet',
      emptyBody: 'Start a project and log some devlogs.',
      icon: 'schedule',
      format: (v) => `${v}h`,
    },
    {
      title: 'Current Streak',
      subtitle: 'Active journaling streaks right now',
      rows: data.streaks,
      emptyTitle: 'No streaks yet',
      emptyBody: 'Come back tomorrow to start one.',
      icon: 'local_fire_department',
      format: (v) => `${v}d`,
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      <GuildLeaderboardTable rows={data.guild_referrals} mine={data.mine_guild} />
      {boards.map((board) => (
        <LeaderboardTable key={board.title} board={board} currentUserId={data.current_user_id} />
      ))}
    </div>
  )
}
