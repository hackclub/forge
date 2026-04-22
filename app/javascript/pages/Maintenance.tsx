import { Head } from '@inertiajs/react'

export default function Maintenance() {
  return (
    <>
      <Head title="Maintenance - Forge" />
      <div className="min-h-screen bg-[#0e0e0e] flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <span
            className="material-symbols-outlined text-7xl text-[#ee671c] mb-6 block"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            precision_manufacturing
          </span>
          <h1 className="text-3xl font-headline font-bold text-[#e5e2e1] tracking-tight mb-4">
            Forge is under maintenance
          </h1>
          <p className="text-stone-400 text-sm leading-relaxed mb-6">
            We're working on some updates. Please check back shortly.
          </p>
          <p className="text-stone-500 text-xs">
            Need help? Reach out in{' '}
            <a
              href="https://hackclub.slack.com/archives/C08HKBY2BAE"
              target="_blank"
              rel="noopener"
              className="text-[#ffb595] hover:underline"
            >
              #forge-help
            </a>
            {' '}on Slack.
          </p>
        </div>
      </div>
    </>
  )
}
