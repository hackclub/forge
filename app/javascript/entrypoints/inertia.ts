import { createElement, Fragment } from 'react'
import { createInertiaApp } from '@inertiajs/react'
import { createRoot } from 'react-dom/client'
import DefaultLayout from '../layouts/DefaultLayout'
import AdminLayout from '../layouts/AdminLayout'
import ImpersonationBanner from '../components/ImpersonationBanner'
import type { ReactNode } from 'react'

interface PageModule {
  default: { layout?: (page: ReactNode) => ReactNode; __wrapped?: boolean }
}

// Enhance server-rendered markdown links (internal prefetch + Inertia visits)
import './markdown-links'

createInertiaApp({
  resolve: (name) => {
    const pages = import.meta.glob<PageModule>('../pages/**/*.tsx', { eager: true })
    const page = pages[`../pages/${name}.tsx`]
    if (!page) {
      console.error(`Missing Inertia page component: '${name}.tsx'`)
      return page
    }

    if (!page.default.__wrapped) {
      const userLayout = page.default.layout
      const baseLayout =
        userLayout ??
        (name.startsWith('Admin/')
          ? (p: ReactNode) => createElement(AdminLayout, null, p)
          : (p: ReactNode) => createElement(DefaultLayout, null, p))

      page.default.layout = (p: ReactNode) =>
        createElement(Fragment, null, baseLayout(p), createElement(ImpersonationBanner))
      page.default.__wrapped = true
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
