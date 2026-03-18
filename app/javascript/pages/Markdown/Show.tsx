import { Head } from '@inertiajs/react'

export default function MarkdownShow({ content_html, page_title }: { content_html: string; page_title: string }) {
  return (
    <>
      <Head title={`${page_title} - Quarry`} />
      <div className="markdown-content" dangerouslySetInnerHTML={{ __html: content_html }} />
    </>
  )
}
