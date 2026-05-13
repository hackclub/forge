function csrfToken(): string {
  if (typeof document === 'undefined') return ''
  return document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content || ''
}

export function trackReviewEvent(
  projectId: number,
  button: string,
  metadata: Record<string, unknown> = {},
): void {
  if (typeof window === 'undefined') return
  fetch(`/admin/reviews/${projectId}/track`, {
    method: 'POST',
    keepalive: true,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-CSRF-Token': csrfToken(),
    },
    body: JSON.stringify({ button, metadata }),
  }).catch(() => {})
}
