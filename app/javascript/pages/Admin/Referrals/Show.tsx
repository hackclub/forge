import { router, Link } from '@inertiajs/react'
import { ArrowLeft, CheckCheck } from 'lucide-react'
import { Badge } from '@/components/admin/ui/badge'
import { Button } from '@/components/admin/ui/button'
import { Card, CardContent } from '@/components/admin/ui/card'

interface Referral {
  id: number
  status: 'pending' | 'eligible' | 'approved'
  referred: { id: number; display_name: string; avatar: string }
  qualifying_project: { id: number; name: string } | null
  eligible_at: string | null
  approved_at: string | null
  created_at: string
}

interface Stats {
  total_unique_referrals: number
  approved_count: number
  eligible_count: number
  pending_count: number
  prize_pool: number
  total_paid_out_to_pool: number
  total_referral_spend: number
}

function statusBadge(status: Referral['status']) {
  switch (status) {
    case 'approved':
      return <Badge variant="success">Approved</Badge>
    case 'eligible':
      return <Badge variant="warning">Eligible</Badge>
    case 'pending':
      return <Badge variant="secondary">Pending</Badge>
  }
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
        <p className="text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  )
}

export default function AdminReferralsShow({
  user,
  referrals,
  stats,
}: {
  user: { id: number; display_name: string; avatar: string; referral_code: string }
  referrals: Referral[]
  stats: Stats
}) {
  const eligibleCount = referrals.filter((r) => r.status === 'eligible').length

  function approveOne(id: number) {
    if (!confirm('Approve this referral and pay out the referrer?')) return
    router.post(`/admin/referrals/approve/${id}`)
  }

  function approveAll() {
    if (eligibleCount === 0) return
    if (!confirm(`Approve all ${eligibleCount} eligible referrals for ${user.display_name}?`)) return
    router.post(`/admin/referrals/${user.id}/approve_all`)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/admin/referrals">
          <ArrowLeft className="size-4" />
          Back to Referrals
        </Link>
      </Button>

      <div className="flex items-center gap-4">
        <img src={user.avatar} alt="" className="size-14 rounded-full" />
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">{user.display_name}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Referral code: <span className="font-mono text-foreground">{user.referral_code}</span>
          </p>
        </div>
        {eligibleCount > 0 && (
          <Button onClick={approveAll}>
            <CheckCheck className="size-4" />
            Approve All ({eligibleCount})
          </Button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Total" value={referrals.length} />
        <StatCard label="Eligible" value={eligibleCount} />
        <StatCard label="Approved" value={referrals.filter((r) => r.status === 'approved').length} />
      </div>

      {referrals.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center">
            <p className="text-base font-medium mb-1">No referrals</p>
            <p className="text-sm text-muted-foreground">This user hasn't referred anyone yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {referrals.map((r) => (
            <Card key={r.id}>
              <CardContent className="p-3 flex items-center gap-3">
                <img src={r.referred.avatar} alt="" className="size-10 rounded-full" />
                <div className="flex-1 min-w-0">
                  <Link href={`/admin/users/${r.referred.id}`} className="font-medium hover:underline truncate block">
                    {r.referred.display_name}
                  </Link>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Signed up {r.created_at}
                    {r.qualifying_project && (
                      <>
                        {' '}
                        · Shipped{' '}
                        <Link href={`/projects/${r.qualifying_project.id}`} className="hover:underline text-foreground">
                          {r.qualifying_project.name}
                        </Link>
                      </>
                    )}
                  </p>
                </div>
                {statusBadge(r.status)}
                {r.status === 'eligible' && (
                  <Button size="sm" onClick={() => approveOne(r.id)}>
                    Approve
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Approved referrals pay out 0.25c to the referrer and add 0.1c to the prize pool ({stats.prize_pool.toFixed(2)}c
        current).
      </p>
    </div>
  )
}
