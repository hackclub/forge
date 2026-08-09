import { Link, router } from '@inertiajs/react'
import { MessageSquare, Send, Trophy, HeartCrack, UserPlus } from 'lucide-react'
import { Badge } from '@/components/admin/ui/badge'
import { Button } from '@/components/admin/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/admin/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/admin/ui/table'

interface StreakBreak {
  id: number
  user_id: number
  user_display_name: string
  broke_on: string
  streak_length: number
}

export default function AdminSlackPingsIndex({
  contributors_channel_configured,
  streaks_channel_configured,
  stats_preview,
  recent_breaks,
}: {
  contributors_channel_configured: boolean
  streaks_channel_configured: boolean
  stats_preview: string
  recent_breaks: StreakBreak[]
}) {
  const triggers = [
    {
      path: '/admin/slack_pings/weekly_ping',
      icon: Send,
      title: 'Weekly contributor ping',
      description:
        'Posts the weekly check-in message to the contributors channel with the key stats as a thread reply. Also runs automatically every Wednesday at 6pm ET.',
      enabled: contributors_channel_configured,
    },
    {
      path: '/admin/slack_pings/leaderboard',
      icon: Trophy,
      title: 'Streak leaderboard',
      description:
        'Posts the daily streak leaderboard (streaks + coins) to #forge. Also runs automatically every day at a randomized time.',
      enabled: streaks_channel_configured,
    },
    {
      path: '/admin/slack_pings/streak_breaks',
      icon: HeartCrack,
      title: 'Streak break check',
      description:
        'Checks for freshly broken streaks and announces them in #forge immediately (the hourly check posts at randomized times).',
      enabled: streaks_channel_configured,
    },
    {
      path: '/admin/slack_pings/invites',
      icon: UserPlus,
      title: 'Contributor channel invites',
      description:
        'Invites everyone with an admin, reviewer, support, or fulfillment role to the contributors channel. Also runs automatically every day.',
      enabled: contributors_channel_configured,
    },
  ]

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <MessageSquare className="size-5" />
          Slack Pings
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Contributor check-ins, streak announcements, and channel invites — trigger any of them manually here.
        </p>
      </div>

      {(!contributors_channel_configured || !streaks_channel_configured) && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="p-3 text-sm text-destructive">
            {!contributors_channel_configured && (
              <p>`SLACK_CONTRIBUTORS_CHANNEL_ID` is not set — contributor pings and invites are disabled.</p>
            )}
            {!streaks_channel_configured && (
              <p>`SLACK_STREAKS_CHANNEL_ID` is not set — streak announcements are disabled.</p>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {triggers.map((trigger) => (
          <Card key={trigger.path}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <trigger.icon className="size-4" />
                {trigger.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{trigger.description}</p>
              <Button disabled={!trigger.enabled} onClick={() => router.post(trigger.path)}>
                <Send className="size-3.5" />
                Send now
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Stats preview</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-sm whitespace-pre-wrap rounded-md bg-muted p-4">{stats_preview}</pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HeartCrack className="size-4" />
            Recent streak breaks
            <Badge variant="secondary">{recent_breaks.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recent_breaks.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No streak breaks announced yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Streak</TableHead>
                  <TableHead>Broke on</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recent_breaks.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">
                      <Link href={`/admin/users/${b.user_id}`} className="hover:underline">
                        {b.user_display_name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{b.streak_length} days</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{b.broke_on}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
