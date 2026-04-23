import { Link } from '@inertiajs/react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center px-6">
        <h1 className="text-[clamp(6rem,15vw,10rem)] font-headline font-bold tracking-tight leading-none text-[#ee671c]">
          404
        </h1>
        <div className="w-12 h-px bg-white/10 mx-auto my-6" />
        <p className="text-2xl font-headline font-bold text-[#e5e2e1] tracking-tight mb-3">Page not found</p>
        <p className="text-stone-500 text-sm mb-8 max-w-sm mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-block signature-smolder text-[#4c1a00] px-8 py-3 font-bold uppercase tracking-wider text-xs"
        >
          Back to Home
        </Link>
      </div>
    </div>
  )
}
