import { useState } from 'react'
import { Head, router } from '@inertiajs/react'
import { Plus, X, Trash2, Pencil } from 'lucide-react'
import { Badge } from '@/components/admin/ui/badge'
import { Button } from '@/components/admin/ui/button'
import { Card, CardContent } from '@/components/admin/ui/card'
import { Input } from '@/components/admin/ui/input'
import { Textarea } from '@/components/admin/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/admin/ui/table'

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
      <Head title="News - Admin" />
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">News</h1>
          <Button onClick={() => (showForm ? resetForm() : setShowForm(true))}>
            {showForm ? <X className="size-4" /> : <Plus className="size-4" />}
            {showForm ? 'Cancel' : 'New Post'}
          </Button>
        </div>

        {showForm && (
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={submit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Title</label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Forge is extended!" required />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Body</label>
                  <Textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={5}
                    placeholder="What's new?"
                    required
                  />
                </div>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
                  Publish immediately
                </label>
                <div className="flex gap-2">
                  <Button type="submit">{editingId ? 'Save Changes' : 'Create'}</Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="pt-6">
            {posts.length === 0 ? (
              <p className="text-sm text-muted-foreground py-12 text-center">No news posts yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="text-right w-24"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {posts.map((post) => (
                    <TableRow key={post.id}>
                      <TableCell className="font-medium max-w-md truncate">{post.title}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{post.author_name}</TableCell>
                      <TableCell>
                        <button onClick={() => toggle(post.id)} className="cursor-pointer">
                          {post.published ? (
                            <Badge variant="success">Published</Badge>
                          ) : (
                            <Badge variant="secondary">Draft</Badge>
                          )}
                        </button>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{post.updated_at}</TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button variant="ghost" size="icon" onClick={() => startEdit(post)}>
                          <Pencil className="size-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => destroy(post.id, post.title)}>
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
