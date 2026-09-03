import { Badge } from '@/components/admin/ui/badge'
import { GroupMemberTable } from './GroupMemberTable'
import type { ReviewProject } from './types'
import { formatCoinRate } from '@/lib/tiers'

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="mb-0.5 text-xs text-muted-foreground">{label}</p>
      <p className="truncate font-mono text-sm">{value}</p>
    </div>
  )
}

export function ProjectOverviewCard({
  project,
  claimedHours,
  previewCoins,
}: {
  project: ReviewProject
  claimedHours: number
  previewCoins: number
}) {
  return (
    <div className="rounded-md border border-border bg-card overflow-hidden">
      <div className="p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-3 lg:flex-1">
            {project.cover_image_url && (
              <img
                src={project.cover_image_url}
                alt=""
                className="w-20 h-20 object-cover rounded-md border border-border shrink-0"
              />
            )}
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-semibold leading-snug truncate">{project.name}</h1>
              {project.subtitle && <p className="text-sm text-muted-foreground line-clamp-2">{project.subtitle}</p>}
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1.5 flex-wrap">
                <a
                  href={`/admin/users/${project.user_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-foreground hover:underline"
                >
                  <img src={project.user_avatar} alt="" className="size-4 rounded-full" />
                  <span>{project.user_display_name}</span>
                </a>
                <span>·</span>
                <a href={`mailto:${project.user_email}`} className="hover:underline text-foreground/80 font-mono">
                  {project.user_email}
                </a>
                <span>·</span>
                {project.build_review ? (
                  <Badge className="bg-orange-500/15 text-orange-700 dark:text-orange-300 border border-orange-500/30">
                    Build Review
                  </Badge>
                ) : (
                  <span>{`${project.tier.replace('_', ' ')}${project.budget ? ` · ${project.budget}` : ''}`}</span>
                )}
                {project.uses_ai && (
                  <>
                    <span>·</span>
                    <Badge className="bg-violet-500/15 text-violet-700 dark:text-violet-300 border border-violet-500/30">
                      Made with AI
                    </Badge>
                  </>
                )}
                {project.linked_project && (
                  <>
                    <span>·</span>
                    <a
                      href={`/admin/projects/${project.linked_project.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline text-foreground"
                    >
                      for: {project.linked_project.name} ↗
                    </a>
                  </>
                )}
                <span>·</span>
                <span>started {project.created_at}</span>
                {project.from_slack && project.slack_url && (
                  <>
                    <span>·</span>
                    <a
                      href={project.slack_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline text-foreground"
                    >
                      Slack pitch ↗
                    </a>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Stacks under the header on narrow screens, sits in the header's
              empty right-hand side once there is room for it. */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 border-t border-border pt-3 sm:grid-cols-4 lg:shrink-0 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-5">
            <Stat label="Hours claimed" value={`${claimedHours.toFixed(1)}h`} />
            <Stat label="Coin rate" value={formatCoinRate(project.coin_rate)} />
            <Stat label="Devlogs" value={String(project.devlogs.length)} />
            <Stat label="Coins (preview)" value={`${previewCoins.toFixed(2)}c`} />
          </div>
        </div>
      </div>

      {project.is_group_project && <GroupMemberTable members={project.members} />}

      {project.override_hours_justification && (
        <div className="px-4 py-2 border-t border-border text-xs">
          <span className="text-muted-foreground">Existing override: </span>
          <span>{project.override_hours_justification}</span>
        </div>
      )}

      {project.uses_ai && project.ai_usage && (
        <div className="px-4 py-2 border-t border-border text-xs">
          <span className="text-muted-foreground">AI usage: </span>
          <span className="whitespace-pre-wrap">{project.ai_usage}</span>
        </div>
      )}
    </div>
  )
}
