import { createElement } from 'react'
import { createInertiaApp } from '@inertiajs/react'
import { createRoot } from 'react-dom/client'
import DefaultLayout from '../layouts/DefaultLayout'
import AdminLayout from '../layouts/AdminLayout'
import type { ReactNode } from 'react'

// Enhance server-rendered markdown links (internal prefetch + Inertia visits)
import './markdown-links'

interface PageModule {
  default: { layout?: (page: ReactNode) => ReactNode }
}

createInertiaApp({
  resolve: (name) => {
    const pages = import.meta.glob<PageModule>('../pages/**/*.tsx', { eager: true })
    const page = pages[`../pages/${name}.tsx`]
    if (!page) {
      console.error(`Missing Inertia page component: '${name}.tsx'`)
    }

    if (!page.default.layout) {
      const fallback = name.startsWith('Admin/')
        ? (p: ReactNode) => createElement(AdminLayout, null, p)
        : (p: ReactNode) => createElement(DefaultLayout, null, p)
      page.default.layout = fallback
    }
    return page
  },

  setup({ el, App, props }) {
    if (el) {
      createRoot(el).render(createElement(App, props))
    }
  },

  defaults: {
    form: {
      forceIndicesArrayFormatInFormData: false,
    },
    future: {
      useDialogForErrorModal: true,
      preserveEqualProps: true,
    },
  },
})
