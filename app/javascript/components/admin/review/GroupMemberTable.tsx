import { Users } from 'lucide-react'
import { Badge } from '@/components/admin/ui/badge'
import type { ReviewMember } from './types'

export function GroupMemberTable({ members }: { members: ReviewMember[] }) {
  return (
    <div className="border-t border-border">
      <div className="px-3 py-2 flex items-center gap-2">
        <Users className="size-3.5 text-muted-foreground" />
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Team · payout split by devlog hours, each member's own multipliers
        </span>
      </div>
      <table className="w-full text-xs">
        <thead>
          <tr className="text-muted-foreground border-t border-border">
            <th className="text-left font-medium px-3 py-1.5">Member</th>
            <th className="text-right font-medium px-3 py-1.5">Devlog hrs</th>
            <th className="text-right font-medium px-3 py-1.5">Approved hrs</th>
            <th className="text-right font-medium px-3 py-1.5">Streak ×</th>
            <th className="text-right font-medium px-3 py-1.5">Guild ×</th>
            <th className="text-right font-medium px-3 py-1.5">Coins</th>
          </tr>
        </thead>
        <tbody>
          {members.map((member) => (
            <tr key={member.user_id} className="border-t border-border hover:bg-muted/20 transition-colors">
              <td className="px-3 py-1.5">
                <a
                  href={`/admin/users/${member.user_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 hover:underline"
                >
                  <img src={member.avatar} alt="" className="size-4 rounded-full" />
                  <span>{member.display_name}</span>
                  {member.is_owner && <Badge variant="outline">Owner</Badge>}
                </a>
              </td>
              <td className="px-3 py-1.5 text-right font-mono">{member.devlog_hours.toFixed(1)}h</td>
              <td className="px-3 py-1.5 text-right font-mono">
                {member.approved_hours != null ? `${member.approved_hours.toFixed(1)}h` : '—'}
              </td>
              <td className="px-3 py-1.5 text-right font-mono">
                {member.streak_multiplier != null ? member.streak_multiplier.toFixed(2) : '—'}
              </td>
              <td className="px-3 py-1.5 text-right font-mono">
                {member.guild_multiplier != null ? member.guild_multiplier.toFixed(2) : '—'}
              </td>
              <td className="px-3 py-1.5 text-right font-mono">
                {member.projected_coins != null ? `${member.projected_coins.toFixed(2)}c` : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
