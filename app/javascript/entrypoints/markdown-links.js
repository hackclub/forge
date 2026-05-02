import { router } from '@inertiajs/react'

function isInternalLink(url) {
  try {
    const u = new URL(url, window.location.href)
    return u.origin === window.location.origin && (u.pathname.startsWith('/') || u.pathname === window.location.pathname)
  } catch (e) {
    return false
  }
}

function findMarkdownContainer(el) {
  return el.closest('.markdown-content')
}

function handleClick(e) {
  const a = e.target.closest('a')
  if (!a) return
  const href = a.getAttribute('href')
  if (!href) return
  if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return

  if (isInternalLink(href)) {
    e.preventDefault()
    router.visit(href)
  }
}

function handleMouseOver(e) {
  const a = e.target.closest('a')
  if (!a) return
  const href = a.getAttribute('href')
  if (!href) return
  if (isInternalLink(href) && typeof router.prefetch === 'function') {
    router.prefetch(href)
  }
}

// Add delegated listeners
document.addEventListener('click', (e) => {
  try { handleClick(e) } catch (err) { /* swallow */ }
})
document.addEventListener('mouseover', (e) => {
  try { handleMouseOver(e) } catch (err) { /* swallow */ }
})

// On initial load, make sure anchor targets within markdown that point to same-page hashes still scroll
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.markdown-content a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const hash = a.getAttribute('href')
      if (!hash) return
      const id = hash.slice(1)
      const target = document.getElementById(id)
      if (target) {
        e.preventDefault()
        target.scrollIntoView({ behavior: 'smooth', block: 'start' })
        history.replaceState(history.state, '', hash)
      }
    })
  })
})
