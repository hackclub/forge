import { Head, Link } from '@inertiajs/react'
import type { NewsPostSummary } from '@/types'

export default function NewsIndex({ posts }: { posts: NewsPostSummary[] }) {
  return (
    <>
      <Head title="News — Forge" />
      <div className="p-5 md:p-12 max-w-4xl mx-auto space-y-12">
        <section>
          <h1 className="text-5xl font-medium font-headline tracking-tight text-white leading-tight mb-2">
            Latest <span className="text-[#ee671c]">News</span>
          </h1>
          <p className="text-stone-500">Updates and announcements from the Forge team.</p>
        </section>

        {posts.length === 0 ? (
          <div className="bg-[#1c1b1b] ghost-border p-16 text-center">
            <span className="material-symbols-outlined text-5xl text-stone-700 mb-4">campaign</span>
            <p className="text-stone-300 text-lg font-headline font-medium mb-2">No news yet</p>
            <p className="text-stone-500 text-sm">Check back soon for updates.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/news/${post.id}`}
                className="block bg-[#1c1b1b] ghost-border p-8 hover:bg-[#2a2a2a] transition-colors group min-w-0 overflow-hidden"
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500 mb-3">
                  {post.published_at} · {post.author_name}
                </p>
                <h2 className="text-2xl font-headline font-bold text-[#e5e2e1] group-hover:text-[#ffb595] tracking-tight mb-4 transition-colors break-words">
                  {post.title}
                </h2>
                <div
                  className="markdown-content text-stone-400 text-sm leading-relaxed line-clamp-3 break-words [overflow-wrap:anywhere] !max-w-none !mx-0 !my-0 !px-0"
                  dangerouslySetInnerHTML={{ __html: post.body_html }}
                />
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
