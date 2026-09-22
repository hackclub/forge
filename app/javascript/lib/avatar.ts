export const AVATAR_FALLBACK = '/static-assets/pfp_fallback.webp'

export function onAvatarError({ currentTarget }: { currentTarget: HTMLImageElement }) {
  if (currentTarget.src.endsWith(AVATAR_FALLBACK)) return

  currentTarget.onerror = null
  currentTarget.src = AVATAR_FALLBACK
}
