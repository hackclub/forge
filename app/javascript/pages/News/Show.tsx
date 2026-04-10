import { Head, Link } from '@inertiajs/react'

interface NewsPost {
  id: number
  title: string
  body_html: string
  published_at: string
  author_name: string
}

export default function NewsShow({ post }: { post: NewsPost }) {
  return (
    <>
      <Head title={`${post.title} — News`} />
      <div className="p-12 max-w-3xl mx-auto space-y-8">
        <Link
          href="/news"
          className="ghost-border inline-flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-stone-500 hover:text-[#e5e2e1] transition-colors"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          All news
        </Link>

        <article className="bg-[#1c1b1b] ghost-border p-10 min-w-0 overflow-hidden">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500 mb-3">
            {post.published_at} · {post.author_name}
          </p>
          <h1 className="text-4xl font-headline font-bold text-[#e5e2e1] tracking-tight mb-8 break-words">
            {post.title}
          </h1>
          <div
            className="markdown-content text-stone-300 !max-w-none !mx-0 !my-0 !px-0"
            dangerouslySetInnerHTML={{ __html: post.body_html }}
          />
        </article>
      </div>
    </>
  )
}
