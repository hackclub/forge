import { Badge } from '@/components/admin/ui/badge'
import { GroupMemberTable } from './GroupMemberTable'
import type { ReviewProject } from './types'

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
      <div className="p-4 space-y-2">
        <div className="flex items-start gap-3">
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
      </div>

      <div className="grid grid-cols-4 divide-x divide-border border-t border-border">
        <div className="px-3 py-2">
          <p className="text-xs text-muted-foreground mb-0.5">Hours claimed</p>
          <p className="text-sm font-mono">{claimedHours.toFixed(1)}h</p>
        </div>
        <div className="px-3 py-2">
          <p className="text-xs text-muted-foreground mb-0.5">Coin rate</p>
          <p className="text-sm font-mono">{project.coin_rate}/hr</p>
        </div>
        <div className="px-3 py-2">
          <p className="text-xs text-muted-foreground mb-0.5">Devlogs</p>
          <p className="text-sm font-mono">{project.devlogs.length}</p>
        </div>
        <div className="px-3 py-2">
          <p className="text-xs text-muted-foreground mb-0.5">Coins (preview)</p>
          <p className="text-sm font-mono">{previewCoins.toFixed(2)}c</p>
        </div>
      </div>

      {project.is_group_project && <GroupMemberTable members={project.members} />}

      {project.override_hours_justification && (
        <div className="px-4 py-2 border-t border-border text-xs">
          <span className="text-muted-foreground">Existing override: </span>
          <span>{project.override_hours_justification}</span>
        </div>
      )}
    </div>
  )
}
