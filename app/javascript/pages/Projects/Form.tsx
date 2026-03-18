import { useForm, usePage } from '@inertiajs/react'
import type { ProjectForm, SharedProps } from '@/types'

export default function ProjectsForm({
  project,
  title,
  submit_url,
  method,
}: {
  project: ProjectForm
  title: string
  submit_url: string
  method: string
}) {
  const { errors } = usePage<SharedProps>().props

  const form = useForm({
    name: project.name,
    description: project.description,
    demo_link: project.demo_link,
    repo_link: project.repo_link,
    is_unlisted: project.is_unlisted,
    tags: project.tags,
  })

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (method === 'patch') {
      form.patch(submit_url)
    } else {
      form.post(submit_url)
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="font-black text-yellow-100/90 tracking-tight text-4xl mb-6">{title}</h1>

      <form onSubmit={submit} className="space-y-4">
        {Object.keys(errors).length > 0 && (
          <div className="border border-red-800/30 bg-red-950/20 text-red-400/80 p-4 mb-4">
            <ul>
              {Object.entries(errors).map(([field, messages]) =>
                messages.map((msg) => (
                  <li key={`${field}-${msg}`}>
                    {field} {msg}
                  </li>
                )),
              )}
            </ul>
          </div>
        )}

        <div>
          <label htmlFor="name" className="block text-yellow-100/40 text-xs uppercase tracking-wider font-bold mb-1">
            Title
          </label>
          <input
            type="text"
            id="name"
            value={form.data.name}
            onChange={(e) => form.setData('name', e.target.value)}
            className="mt-1 block w-full bg-yellow-950/20 border border-yellow-800/30 text-yellow-100/80 placeholder-yellow-100/15 focus:border-yellow-600/50 focus:outline-none px-3 py-2"
            required
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-yellow-100/40 text-xs uppercase tracking-wider font-bold mb-1">
            Description
          </label>
          <textarea
            id="description"
            value={form.data.description}
            onChange={(e) => form.setData('description', e.target.value)}
            rows={4}
            className="mt-1 block w-full bg-yellow-950/20 border border-yellow-800/30 text-yellow-100/80 placeholder-yellow-100/15 focus:border-yellow-600/50 focus:outline-none px-3 py-2"
          />
        </div>

        <div>
          <label htmlFor="demo_link" className="block text-yellow-100/40 text-xs uppercase tracking-wider font-bold mb-1">
            Demo link
          </label>
          <input
            type="url"
            id="demo_link"
            value={form.data.demo_link}
            onChange={(e) => form.setData('demo_link', e.target.value)}
            className="mt-1 block w-full bg-yellow-950/20 border border-yellow-800/30 text-yellow-100/80 placeholder-yellow-100/15 focus:border-yellow-600/50 focus:outline-none px-3 py-2"
            placeholder="https://"
          />
        </div>

        <div>
          <label htmlFor="repo_link" className="block text-yellow-100/40 text-xs uppercase tracking-wider font-bold mb-1">
            Repo link
          </label>
          <input
            type="url"
            id="repo_link"
            value={form.data.repo_link}
            onChange={(e) => form.setData('repo_link', e.target.value)}
            className="mt-1 block w-full bg-yellow-950/20 border border-yellow-800/30 text-yellow-100/80 placeholder-yellow-100/15 focus:border-yellow-600/50 focus:outline-none px-3 py-2"
            placeholder="https://"
          />
        </div>

        <div>
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.data.is_unlisted}
              onChange={(e) => form.setData('is_unlisted', e.target.checked)}
              className="border-yellow-800/30 accent-yellow-600"
            />
            <span className="text-yellow-100/40 text-xs uppercase tracking-wider font-bold">Unlisted</span>
          </label>
        </div>

        <div>
          <button
            type="submit"
            className="bg-gradient-to-b from-yellow-600 to-yellow-800 hover:from-yellow-500 hover:to-yellow-700 text-[#1a1200] font-black uppercase tracking-wider px-4 py-2 cursor-pointer"
            disabled={form.processing}
          >
            {form.processing ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  )
}
