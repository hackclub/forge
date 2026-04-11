import { useState } from 'react'
import { Head, router } from '@inertiajs/react'

interface NewsPost {
  id: number
  title: string
  body: string
  published: boolean
  published_at: string | null
  author_name: string
  updated_at: string
}

export default function AdminNewsPostsIndex({ posts }: { posts: NewsPost[] }) {
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [published, setPublished] = useState(true)

  function resetForm() {
    setTitle('')
    setBody('')
    setPublished(true)
    setEditingId(null)
    setShowForm(false)
  }

  function startEdit(post: NewsPost) {
    setEditingId(post.id)
    setTitle(post.title)
    setBody(post.body)
    setPublished(post.published)
    setShowForm(true)
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const payload = { news_post: { title, body, published } }
    if (editingId) {
      router.patch(`/admin/news_posts/${editingId}`, payload, { onSuccess: resetForm })
    } else {
      router.post('/admin/news_posts', payload, { onSuccess: resetForm })
    }
  }

  function toggle(id: number) {
    router.post(`/admin/news_posts/${id}/toggle`)
  }

  function destroy(id: number, postTitle: string) {
    if (!confirm(`Delete "${postTitle}"?`)) return
    router.delete(`/admin/news_posts/${id}`)
  }

  return (
    <>
      <Head title="News — Admin" />
      <div className="p-5 md:p-12 max-w-[1400px] mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-headline font-bold text-[#e5e2e1] tracking-tight">News</h1>
          <button
            onClick={() => (showForm ? resetForm() : setShowForm(true))}
            className="signature-smolder text-[#4c1a00] px-6 py-3 font-bold uppercase tracking-wider text-xs flex items-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">{showForm ? 'close' : 'add'}</span>
            {showForm ? 'Cancel' : 'New Post'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={submit} className="ghost-border bg-[#1c1b1b] p-6 mb-8 space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-[0.2em] text-stone-500 mb-2">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-[#0e0e0e] border-none px-4 py-3 text-[#e5e2e1] focus:ring-1 focus:ring-[#ee671c]/30 placeholder:text-stone-600 text-sm"
                placeholder="Forge is extended!"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-[0.2em] text-stone-500 mb-2">Body</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={5}
                className="w-full bg-[#0e0e0e] border-none px-4 py-3 text-[#e5e2e1] focus:ring-1 focus:ring-[#ee671c]/30 placeholder:text-stone-600 text-sm resize-y"
                placeholder="What's new?"
                required
              />
            </div>
            <label className="flex items-center gap-3 text-sm text-stone-400 cursor-pointer">
              <input
                type="checkbox"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
                className="accent-[#ee671c]"
              />
              Publish immediately
            </label>
            <div className="flex gap-3">
              <button type="submit" className="signature-smolder text-[#4c1a00] px-6 py-3 font-bold uppercase tracking-wider text-xs cursor-pointer">
                {editingId ? 'Save Changes' : 'Create'}
              </button>
              <button type="button" onClick={resetForm} className="ghost-border text-stone-400 px-6 py-3 text-xs font-bold uppercase tracking-wider cursor-pointer">
                Cancel
              </button>
            </div>
          </form>
        )}

        {posts.length > 0 ? (
          <div className="ghost-border overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-5 py-3 text-[10px] uppercase tracking-[0.2em] font-bold text-stone-600">Title</th>
                  <th className="text-left px-5 py-3 text-[10px] uppercase tracking-[0.2em] font-bold text-stone-600">Author</th>
                  <th className="text-left px-5 py-3 text-[10px] uppercase tracking-[0.2em] font-bold text-stone-600">Status</th>
                  <th className="text-left px-5 py-3 text-[10px] uppercase tracking-[0.2em] font-bold text-stone-600">Updated</th>
                  <th className="text-right px-5 py-3 text-[10px] uppercase tracking-[0.2em] font-bold text-stone-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr key={post.id} className="border-b border-white/5 hover:bg-[#1c1b1b] transition-colors">
                    <td className="px-5 py-4 font-headline font-bold text-[#e5e2e1] text-sm max-w-md truncate">{post.title}</td>
                    <td className="px-5 py-4 text-stone-500 text-xs">{post.author_name}</td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => toggle(post.id)}
                        className={`px-3 py-1 text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors ${
                          post.published
                            ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                            : 'bg-stone-500/20 text-stone-500 hover:bg-stone-500/30'
                        }`}
                      >
                        {post.published ? 'Published' : 'Draft'}
                      </button>
                    </td>
                    <td className="px-5 py-4 text-stone-500 text-xs">{post.updated_at}</td>
                    <td className="px-5 py-4 text-right space-x-3">
                      <button
                        onClick={() => startEdit(post)}
                        className="text-stone-500 hover:text-[#ffb595] transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-lg">edit</span>
                      </button>
                      <button
                        onClick={() => destroy(post.id, post.title)}
                        className="text-red-400/50 hover:text-red-400 transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="ghost-border bg-[#1c1b1b] p-16 text-center">
            <p className="text-stone-300 text-lg font-headline font-medium mb-2">No news posts yet</p>
            <p className="text-stone-500 text-sm">Create one to show it in the news sidebar.</p>
          </div>
        )}
      </div>
    </>
  )
}
