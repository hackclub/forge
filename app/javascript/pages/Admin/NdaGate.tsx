import { Link, router } from '@inertiajs/react'
import type { ReactNode } from 'react'
import { AlertTriangle, ArrowLeft, ExternalLink, RefreshCw } from 'lucide-react'
import { Button } from '@/components/admin/ui/button'
import { Card, CardContent } from '@/components/admin/ui/card'
import { useAdminDark } from '@/hooks/useAdminDark'
import { cn } from '@/components/admin/lib/cn'

function NdaGateLayout({ children }: { children: ReactNode }) {
  const [dark] = useAdminDark()

  return (
    <div className={cn('admin bg-background text-foreground min-h-screen flex items-center justify-center p-6', dark && 'dark')}>
      {children}
    </div>
  )
}

export default function AdminNdaGate({ nda_url }: { nda_url: string }) {
  return (
    <Card className="max-w-md w-full">
      <CardContent className="p-6 space-y-4">
        <AlertTriangle className="size-8 text-amber-500" />
        <div className="space-y-2">
          <h1 className="text-xl font-semibold tracking-tight">Hang on!</h1>
          <p className="text-sm text-muted-foreground">
            You're entering Forge Admin, but we don't have a valid NDA on hand for you. Please sign the current NDA to
            continue:
          </p>
        </div>
        <a
          href={nda_url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-medium underline underline-offset-4"
        >
          nda.hackclub.com
          <ExternalLink className="size-3.5" />
        </a>
        <div className="flex gap-2 pt-2">
          <Button variant="outline" asChild>
            <Link href="/">
              <ArrowLeft />
              Return to public
            </Link>
          </Button>
          <Button onClick={() => router.post('/admin/nda_check')}>
            <RefreshCw />
            Refresh check
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

AdminNdaGate.layout = (page: ReactNode) => <NdaGateLayout>{page}</NdaGateLayout>
