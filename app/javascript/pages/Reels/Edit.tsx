import { useState } from 'react'
import { Head, Link, router } from '@inertiajs/react'

interface Props {
  project: { id: number; name: string }
  reel: { id: number; title: string; kind: string }
}

export default function ReelsEdit({ project, reel }: Props) {
  const [title, setTitle] = useState(reel.title)
  const [submitting, setSubmitting] = useState(false)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    router.patch(`/reels/${reel.id}`, { title }, {
      onFinish: () => setSubmitting(false),
    })
  }

  return (
    <>
      <Head title={`Edit reel — ${project.name}`} />
      <div className="p-5 md:p-12 max-w-xl mx-auto">
        <Link
          href={`/projects/${project.id}/reels`}
          className="text-stone-500 hover:text-[#ffb595] text-xs uppercase tracking-[0.2em] font-bold inline-flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Manage reels
        </Link>
        <h1 className="text-3xl font-headline font-bold tracking-tight text-[#e5e2e1] mt-3 mb-6">Edit reel</h1>

        <form onSubmit={submit} className="space-y-6">
          <div className="bg-[#1c1b1b] ghost-border p-6">
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-500 mb-3">Title</p>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              placeholder="A short title for your reel..."
              className="w-full bg-[#0e0e0e] border-none px-4 py-3 text-[#e5e2e1] text-sm focus:ring-1 focus:ring-[#ee671c]/30 placeholder:text-stone-600"
              autoFocus
            />
            <p className="text-[10px] text-stone-600 text-right mt-1">{title.length} / 200</p>
            <p className="text-[10px] text-stone-600 mt-3">
              Media (video / images / audio) can't be swapped after publishing — delete and repost if you need to change it.
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href={`/projects/${project.id}/reels`}
              className="ghost-border bg-[#1c1b1b] hover:bg-[#2a2a2a] text-stone-400 hover:text-[#ffb595] px-4 py-2.5 uppercase tracking-wider text-[10px] font-bold flex items-center gap-2"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="signature-smolder text-[#4c1a00] px-6 py-2.5 font-bold uppercase tracking-wider text-xs flex items-center gap-2 disabled:opacity-40 cursor-pointer"
            >
              {submitting ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
