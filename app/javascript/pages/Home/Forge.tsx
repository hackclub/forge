import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Head, usePage } from '@inertiajs/react'
import type { SharedProps } from '@/types'
import OnboardingModal from '@/components/OnboardingModal'
import ForgePopup, { type ForgePopupSize } from '@/components/ForgePopup'
import ProjectsPopup from '@/components/forge/ProjectsPopup'
import ShippingPopup from '@/components/forge/ShippingPopup'
import ShopPopup from '@/components/forge/ShopPopup'
import ExplorePopup from '@/components/forge/ExplorePopup'
import LeaderboardPopup from '@/components/forge/LeaderboardPopup'
import FaqPopup from '@/components/forge/FaqPopup'
import ForgeHud from '@/components/forge/ForgeHud'
import FireIcon from '@/components/FireIcon'
import ForgeMusic from '@/components/forge/ForgeMusic'
import type { DashboardProject } from '@/components/forge/projectStatus'
import CollaborationInvitesCard, { type PendingCollaborationInvite } from '@/components/CollaborationInvitesCard'

const DEBUG_HOTSPOTS = false

const EDIT_MODE = false

const TOUR_EDIT_MODE = false

type PopupId = 'projects' | 'shipping' | 'faq' | 'explore' | 'leaderboard' | 'shop'

interface ForgeObject {
  id: PopupId
  label: string
  overlay: string
  icon: string
  tour?: string
  x: number
  y: number
  w: number
  h: number
  rot?: number
  points?: [number, number][]
  lx?: number
  ly?: number
  tbox?: { x: number; y: number; w: number; h: number }
}

const OBJECTS: ForgeObject[] = [
  {
    id: 'leaderboard',
    label: 'Leaderboard',
    overlay: '/sign.png',
    icon: 'emoji_events',
    tour: 'nav-leaderboard',
    x: 12,
    y: 26,
    w: 33,
    h: 35,
    rot: -11,
    points: [
      [11.4, 33.4],
      [39.8, 20.4],
      [43.9, 22.8],
      [45.1, 51.9],
      [16.6, 67.7],
      [13.6, 67.1],
      [11.8, 40.7],
    ],
    lx: 25.7,
    ly: 23.5,
    tbox: { x: 11.2, y: 20.9, w: 34.3, h: 47.4 },
  },
  {
    id: 'faq',
    label: 'Resources',
    overlay: '/scroll.png',
    icon: 'menu_book',
    tour: 'nav-docs',
    x: 3,
    y: 4,
    w: 9,
    h: 21,
    rot: 0,
    tbox: { x: 2.3, y: 2.6, w: 10.9, h: 22.7 },
  },
  {
    id: 'shop',
    label: 'Shop',
    overlay: '/table.png',
    icon: 'storefront',
    tour: 'nav-shop',
    x: 29,
    y: 64,
    w: 21,
    h: 21,
    rot: -23,
    points: [
      [29.3, 74.6],
      [40.3, 63.4],
      [43.9, 64.7],
      [48.6, 68.2],
      [49.3, 76.1],
      [36.3, 86.2],
      [29.8, 81.4],
    ],
    lx: 33.5,
    ly: 66.3,
    tbox: { x: 27.3, y: 60.1, w: 23.8, h: 30.3 },
  },
  {
    id: 'shipping',
    label: 'Ship',
    overlay: '/furnace.png',
    icon: 'local_fire_department',
    tour: 'nav-ship',
    x: 56,
    y: 26,
    w: 26,
    h: 54,
    rot: 10,
    points: [
      [63.2, 33.2],
      [79.1, 27.7],
      [80.1, 34],
      [82.6, 47.1],
      [81.8, 76.3],
      [71.2, 85.7],
      [55.8, 74.8],
      [56.1, 67],
      [58.9, 64.1],
      [59.2, 43.4],
    ],
    lx: 68.3,
    ly: 32.4,
    tbox: { x: 53.2, y: 0, w: 29.5, h: 85.9 },
  },
  {
    id: 'explore',
    label: 'Explore',
    overlay: '/shield.png',
    icon: 'explore',
    tour: 'nav-explore',
    x: 84,
    y: 54,
    w: 13,
    h: 23,
    rot: 0,
    points: [
      [85, 58.2],
      [90.5, 54],
      [94.9, 57],
      [96.6, 63.8],
      [96.1, 73.5],
      [93.5, 77],
      [90, 77],
      [86, 74.4],
      [84.4, 67.6],
    ],
    lx: 90.6,
    ly: 50.3,
    tbox: { x: 82.9, y: 48.3, w: 15.6, h: 31.7 },
  },
  {
    id: 'projects',
    label: 'Projects',
    overlay: '/anvil.png',
    icon: 'precision_manufacturing',
    tour: 'nav-dashboard',
    x: 77,
    y: 84,
    w: 16,
    h: 14,
    rot: 16,
    points: [
      [79.8, 81.6],
      [93.1, 89.6],
      [92.7, 92.1],
      [88.3, 92.1],
      [86.2, 97.6],
      [78.7, 94.3],
      [80.2, 88.4],
      [78.1, 85.2],
    ],
    lx: 85.7,
    ly: 82.1,
    tbox: { x: 75.8, y: 77.3, w: 18.1, h: 22.1 },
  },
]

const EMBERS = [
  { x: 12, delay: 0, dur: 3.4 },
  { x: 30, delay: 1.1, dur: 4.0 },
  { x: 48, delay: 0.5, dur: 3.1 },
  { x: 66, delay: 2.0, dur: 3.8 },
  { x: 80, delay: 1.5, dur: 4.3 },
  { x: 22, delay: 2.6, dur: 3.6 },
  { x: 56, delay: 0.9, dur: 4.1 },
  { x: 38, delay: 3.0, dur: 3.3 },
  { x: 72, delay: 0.3, dur: 3.9 },
  { x: 90, delay: 2.3, dur: 3.5 },
  { x: 6, delay: 1.8, dur: 4.2 },
  { x: 44, delay: 1.3, dur: 3.7 },
]

const POPUP_META: Record<PopupId, { title: string; icon: string; size: ForgePopupSize }> = {
  projects: { title: 'Your Projects', icon: 'precision_manufacturing', size: 'lg' },
  shipping: { title: 'Ship a Project', icon: 'local_fire_department', size: 'md' },
  faq: { title: 'Resources', icon: 'menu_book', size: 'lg' },
  explore: { title: 'Explore the Forge', icon: 'explore', size: 'xl' },
  leaderboard: { title: 'Leaderboard', icon: 'emoji_events', size: 'lg' },
  shop: { title: 'The Shop', icon: 'storefront', size: 'xl' },
}

interface ForgeProps {
  projects: DashboardProject[]
  orph_motivation: { approved_count: number; goal: number; dino_image: string }
  coin_balance: number
  pending_invites: PendingCollaborationInvite[]
}

export default function ForgeScene({ projects, orph_motivation, coin_balance, pending_invites }: ForgeProps) {
  const shared = usePage<SharedProps>().props
  const [open, setOpen] = useState<PopupId | null>(null)
  const lastMeta = useRef(POPUP_META.projects)
  if (open) lastMeta.current = POPUP_META[open]
  const meta = open ? POPUP_META[open] : lastMeta.current

  const showOnboarding = !!shared.auth.user?.needs_onboarding && !shared.auth.user?.is_banned
  const parallaxRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const node = parallaxRef.current
    if (!node) return

    let raf = 0
    let tx = 0
    let ty = 0
    let cx = 0
    let cy = 0
    const max = 5

    const tick = () => {
      cx += (tx - cx) * 0.08
      cy += (ty - cy) * 0.08
      node.style.setProperty('--px', `${cx.toFixed(2)}px`)
      node.style.setProperty('--py', `${cy.toFixed(2)}px`)
      if (Math.abs(tx - cx) > 0.1 || Math.abs(ty - cy) > 0.1) raf = requestAnimationFrame(tick)
      else raf = 0
    }
    const onMove = (e: MouseEvent) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1
      const ny = (e.clientY / window.innerHeight) * 2 - 1
      tx = -nx * max
      ty = -ny * max
      if (!raf) raf = requestAnimationFrame(tick)
    }

    window.addEventListener('mousemove', onMove)
    return () => {
      window.removeEventListener('mousemove', onMove)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  if (EDIT_MODE) {
    return (
      <>
        <Head title="The Forge — edit" />
        <ForgeEditor />
      </>
    )
  }

  if (TOUR_EDIT_MODE) {
    return (
      <>
        <Head title="The Forge — tour boxes" />
        <TourEditor />
      </>
    )
  }

  return (
    <>
      <Head title="The Forge" />

      <div className="fixed inset-0 overflow-hidden bg-[#0e0e0e]">
        <div
          ref={parallaxRef}
          className="absolute inset-0 hidden md:block"
          style={{ transform: 'scale(1.03) translate3d(var(--px, 0), var(--py, 0), 0)', willChange: 'transform' }}
        >
          <img
            src="/dashboard.png"
            alt="The forge workshop"
            draggable={false}
            className="pointer-events-none absolute inset-0 h-full w-full select-none object-fill"
          />
          <ForgeEmbers />
          {OBJECTS.map((o, i) => (
            <ForgeHotspot key={o.id} object={o} index={i} onOpen={() => setOpen(o.id)} debug={DEBUG_HOTSPOTS} />
          ))}
        </div>

        <ForgeHud coinBalance={coin_balance} />

        {pending_invites.length > 0 && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 w-full max-w-xl px-4 hidden md:block">
            <CollaborationInvitesCard invites={pending_invites} />
          </div>
        )}

        <div className="absolute inset-0 overflow-y-auto md:hidden">
          {pending_invites.length > 0 && (
            <div className="p-4 pb-0">
              <CollaborationInvitesCard invites={pending_invites} />
            </div>
          )}
          <div className="relative">
            <img src="/dashboard.png" alt="The forge workshop" className="max-h-60 w-full object-cover object-center" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e0e] via-[#0e0e0e]/40 to-transparent" />
            <h1 className="absolute bottom-3 left-4 font-headline text-2xl font-bold tracking-tight text-[#e5e2e1]">
              The Forge
            </h1>
          </div>
          <div className="grid grid-cols-2 gap-3 p-4">
            {OBJECTS.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => setOpen(o.id)}
                className="corner-accents flex flex-col items-center gap-2.5 bg-[#1c1b1b] p-5 text-center ghost-border transition active:scale-95 hover:bg-[#2a2a2a]"
              >
                {o.icon === 'local_fire_department' ? (
                  <FireIcon className="text-3xl" />
                ) : (
                  <span className="material-symbols-outlined text-3xl text-[#ca5924]">{o.icon}</span>
                )}
                <span className="font-headline text-sm uppercase tracking-wider text-[#e5e2e1]">{o.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <ForgeMusic />

      <ForgePopup
        open={open !== null}
        onClose={() => setOpen(null)}
        title={meta.title}
        icon={meta.icon}
        size={meta.size}
      >
        {open === 'projects' && <ProjectsPopup projects={projects} quest={orph_motivation} />}
        {open === 'shipping' && <ShippingPopup projects={projects} onClose={() => setOpen(null)} />}
        {open === 'faq' && <FaqPopup />}
        {open === 'explore' && <ExplorePopup />}
        {open === 'leaderboard' && <LeaderboardPopup />}
        {open === 'shop' && <ShopPopup />}
      </ForgePopup>

      {showOnboarding && <OnboardingModal />}

      <style>{`
        .forge-overlay-idle { animation: forge-idle 4.5s ease-in-out infinite; }
        @keyframes forge-idle {
          0%, 100% { filter: brightness(1); }
          50% { filter: brightness(1.05) drop-shadow(0 0 8px rgba(202,89,36,0.22)); }
        }
        .forge-ember {
          position: absolute; bottom: 0; width: 3px; height: 3px; border-radius: 9999px;
          background: #ffb24a; box-shadow: 0 0 6px 1px rgba(255,150,50,0.85); opacity: 0;
          animation-name: forge-ember-rise; animation-timing-function: ease-out; animation-iteration-count: infinite;
        }
        @keyframes forge-ember-rise {
          0% { transform: translateY(0) scale(1); opacity: 0; }
          12% { opacity: 1; }
          70% { opacity: 0.8; }
          100% { transform: translateY(-170px) translateX(14px) scale(0.3); opacity: 0; }
        }
      `}</style>
    </>
  )
}

function polyToClip(points: [number, number][]): string {
  return `polygon(${points.map(([x, y]) => `${x}% ${y}%`).join(', ')})`
}

function polyBounds(points: [number, number][]) {
  const xs = points.map((p) => p[0])
  const ys = points.map((p) => p[1])
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  return { minX, maxX, minY, maxY, cx: (minX + maxX) / 2, cy: (minY + maxY) / 2 }
}

function labelCenter(o: ForgeObject): { lx: number; ly: number } {
  const cx = o.points ? polyBounds(o.points).cx : o.x + o.w / 2
  const minY = o.points ? polyBounds(o.points).minY : o.y
  const maxY = o.points ? polyBounds(o.points).maxY : o.y + o.h
  return { lx: cx, ly: minY < 15 ? maxY + 3 : minY - 3 }
}

function autoTourBox(o: ForgeObject): { x: number; y: number; w: number; h: number } {
  if (o.points) {
    const b = polyBounds(o.points)
    return { x: b.minX, y: b.minY, w: b.maxX - b.minX, h: b.maxY - b.minY }
  }
  return { x: o.x, y: o.y, w: o.w, h: o.h }
}

function seedPolygon(o: ForgeObject): [number, number][] {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const cxp = ((o.x + o.w / 2) / 100) * vw
  const cyp = ((o.y + o.h / 2) / 100) * vh
  const hw = ((o.w / 100) * vw) / 2
  const hh = ((o.h / 100) * vh) / 2
  const r = ((o.rot ?? 0) * Math.PI) / 180
  const cos = Math.cos(r)
  const sin = Math.sin(r)
  const corners: [number, number][] = [
    [-hw, -hh],
    [hw, -hh],
    [hw, hh],
    [-hw, hh],
  ]
  return corners.map(([dx, dy]): [number, number] => [
    Math.round(((cxp + dx * cos - dy * sin) / vw) * 1000) / 10,
    Math.round(((cyp + dx * sin + dy * cos) / vh) * 1000) / 10,
  ])
}

function ForgeHotspot({
  object,
  index,
  onOpen,
  debug,
}: {
  object: ForgeObject
  index: number
  onOpen: () => void
  debug: boolean
}) {
  const [active, setActive] = useState(false)
  const poly = object.points
  const base = labelCenter(object)
  const lcx = object.lx ?? base.lx
  const lcy = object.ly ?? base.ly
  const tb = object.tbox ?? autoTourBox(object)
  const tourBox = { left: `${tb.x}%`, top: `${tb.y}%`, width: `${tb.w}%`, height: `${tb.h}%` }

  return (
    <>
      <img
        src={object.overlay}
        alt=""
        aria-hidden
        draggable={false}
        className={`pointer-events-none absolute inset-0 h-full w-full object-fill ${active ? '' : 'forge-overlay-idle'}`}
        style={
          active
            ? { filter: 'brightness(1.15) drop-shadow(0 0 22px rgba(202,89,36,0.7))', transition: 'filter 200ms ease' }
            : { animationDelay: `${index * 0.6}s` }
        }
      />
      <button
        type="button"
        aria-label={object.label}
        onClick={onOpen}
        onMouseEnter={() => setActive(true)}
        onMouseLeave={() => setActive(false)}
        onFocus={() => setActive(true)}
        onBlur={() => setActive(false)}
        className={`absolute z-10 cursor-pointer focus:outline-none ${
          debug ? (poly ? 'bg-[#ca5924]/15' : 'bg-[#ca5924]/10 ring-2 ring-[#ca5924]/70') : ''
        }`}
        style={
          poly
            ? { inset: 0, clipPath: polyToClip(poly) }
            : {
                left: `${object.x}%`,
                top: `${object.y}%`,
                width: `${object.w}%`,
                height: `${object.h}%`,
                transform: `rotate(${object.rot ?? 0}deg)`,
              }
        }
      />
      {object.tour && (
        <div data-tour={object.tour} aria-hidden className="pointer-events-none absolute" style={tourBox} />
      )}
      <span
        style={{
          left: `${lcx}%`,
          top: `${lcy}%`,
          transform: `translate(-50%, -50%) rotate(${object.rot ?? 0}deg)`,
        }}
        className={`pointer-events-none absolute whitespace-nowrap px-2.5 py-1 font-headline text-[10px] uppercase tracking-[0.25em] backdrop-blur-[2px] transition-colors duration-150 ${
          active ? 'bg-[#1c120b]/80 text-[#ffb595]' : 'bg-[#0e0a07]/55 text-[#c4b196]'
        }`}
      >
        {object.label}
      </span>
    </>
  )
}

function ForgeEmbers() {
  return (
    <div className="pointer-events-none absolute" style={{ left: '60%', top: '46%', width: '13%', height: '26%' }}>
      {EMBERS.map((e, i) => (
        <span
          key={i}
          className="forge-ember"
          style={{ left: `${e.x}%`, animationDelay: `${e.delay}s`, animationDuration: `${e.dur}s` }}
        />
      ))}
    </div>
  )
}

type DragMode = 'move' | 'resize' | 'rotate' | 'vertex' | 'polymove' | 'label'
type DragState = { mode: DragMode; i: number; vi: number; sx: number; sy: number; o: ForgeObject }
type StartFn = (e: React.PointerEvent, mode: DragMode, i: number, vi?: number) => void

function ForgeEditor() {
  const [objs, setObjs] = useState<ForgeObject[]>(() => OBJECTS.map((o) => ({ ...o, rot: o.rot ?? 0 })))
  const drag = useRef<DragState | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    function move(e: PointerEvent) {
      const d = drag.current
      if (!d) return
      const vw = window.innerWidth
      const vh = window.innerHeight
      const dx = ((e.clientX - d.sx) / vw) * 100
      const dy = ((e.clientY - d.sy) / vh) * 100
      const r1 = (v: number) => Math.round(v * 10) / 10
      setObjs((prev) =>
        prev.map((o, idx) => {
          if (idx !== d.i) return o
          if (d.mode === 'label') {
            const seed = d.o.lx != null && d.o.ly != null ? { lx: d.o.lx, ly: d.o.ly } : labelCenter(d.o)
            return { ...o, lx: r1(seed.lx + dx), ly: r1(seed.ly + dy) }
          }
          if (d.mode === 'vertex' && d.o.points) {
            const pts = d.o.points.map((p, vi): [number, number] => (vi === d.vi ? [r1(p[0] + dx), r1(p[1] + dy)] : p))
            return { ...o, points: pts }
          }
          if (d.mode === 'polymove' && d.o.points) {
            return { ...o, points: d.o.points.map((p): [number, number] => [r1(p[0] + dx), r1(p[1] + dy)]) }
          }
          if (d.mode === 'move') return { ...o, x: Math.round(d.o.x + dx), y: Math.round(d.o.y + dy) }
          if (d.mode === 'resize') {
            const r = ((d.o.rot ?? 0) * Math.PI) / 180
            const lw = dx * Math.cos(r) + dy * Math.sin(r)
            const lh = -dx * Math.sin(r) + dy * Math.cos(r)
            return { ...o, w: Math.max(2, Math.round(d.o.w + lw)), h: Math.max(2, Math.round(d.o.h + lh)) }
          }
          const c = d.o.points ? polyBounds(d.o.points) : { cx: d.o.x + d.o.w / 2, cy: d.o.y + d.o.h / 2 }
          const ang = (Math.atan2(e.clientY - (c.cy / 100) * vh, e.clientX - (c.cx / 100) * vw) * 180) / Math.PI + 90
          return { ...o, rot: Math.round(ang) }
        }),
      )
    }
    function up() {
      drag.current = null
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
  }, [])

  const start: StartFn = (e, mode, i, vi = 0) => {
    e.preventDefault()
    e.stopPropagation()
    drag.current = { mode, i, vi, sx: e.clientX, sy: e.clientY, o: { ...objs[i] } }
  }

  function toggleShape(i: number) {
    setObjs((prev) =>
      prev.map((o, idx) => {
        if (idx !== i) return o
        if (o.points) {
          const next = { ...o }
          delete next.points
          return next
        }
        return { ...o, points: seedPolygon(o) }
      }),
    )
  }

  function addVertex(i: number, edge: number) {
    setObjs((prev) =>
      prev.map((o, idx) => {
        if (idx !== i || !o.points) return o
        const a = o.points[edge]
        const c = o.points[(edge + 1) % o.points.length]
        const mid: [number, number] = [
          Math.round(((a[0] + c[0]) / 2) * 10) / 10,
          Math.round(((a[1] + c[1]) / 2) * 10) / 10,
        ]
        return { ...o, points: [...o.points.slice(0, edge + 1), mid, ...o.points.slice(edge + 1)] }
      }),
    )
  }

  function removeVertex(i: number, vi: number) {
    setObjs((prev) =>
      prev.map((o, idx) =>
        idx !== i || !o.points || o.points.length <= 3 ? o : { ...o, points: o.points.filter((_, k) => k !== vi) },
      ),
    )
  }

  const exported = objs
    .map((o) => {
      const geo = o.points ? `points ${JSON.stringify(o.points)}` : `x ${o.x}, y ${o.y}, w ${o.w}, h ${o.h}`
      const lab = o.lx != null && o.ly != null ? `, label ${o.lx},${o.ly}` : ''
      return `${o.id}: ${geo}, rot ${o.rot ?? 0}${lab}`
    })
    .join('\n')

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#0e0e0e]">
      <img src="/dashboard.png" alt="" className="pointer-events-none absolute inset-0 h-full w-full object-fill" />

      {objs.map((o, i) =>
        o.points ? (
          <PolyBox
            key={o.id}
            o={o}
            i={i}
            start={start}
            addVertex={addVertex}
            removeVertex={removeVertex}
            toggleShape={toggleShape}
          />
        ) : (
          <RectBox key={o.id} o={o} i={i} start={start} toggleShape={toggleShape} />
        ),
      )}
      {objs.map((o, i) => (
        <LabelHandle key={`l${o.id}`} o={o} i={i} start={start} />
      ))}

      <button
        type="button"
        onClick={() => {
          navigator.clipboard?.writeText(exported).then(
            () => {
              setCopied(true)
              window.setTimeout(() => setCopied(false), 1500)
            },
            () => {},
          )
        }}
        className="absolute bottom-4 left-4 z-40 bg-[#1c1b1b] px-2.5 py-1 font-mono text-[10px] lowercase text-[#ffb595] ghost-border transition-colors hover:bg-[#252423]"
      >
        {copied ? 'copied!' : 'copy'}
      </button>
    </div>
  )
}

function RectBox({
  o,
  i,
  start,
  toggleShape,
}: {
  o: ForgeObject
  i: number
  start: StartFn
  toggleShape: (i: number) => void
}) {
  return (
    <div
      onPointerDown={(e) => start(e, 'move', i)}
      style={{
        left: `${o.x}%`,
        top: `${o.y}%`,
        width: `${o.w}%`,
        height: `${o.h}%`,
        transform: `rotate(${o.rot ?? 0}deg)`,
      }}
      className="absolute cursor-move border-2 border-[#ca5924] bg-[#ca5924]/10"
    >
      <span
        style={{ transform: `rotate(${-(o.rot ?? 0)}deg)`, transformOrigin: 'left top' }}
        className="pointer-events-none absolute left-0.5 top-0.5 bg-black/75 px-1 font-mono text-[9px] leading-tight text-white"
      >
        {o.x},{o.y} · {o.w}×{o.h} · {o.rot ?? 0}°
      </span>
      <span
        onPointerDown={(e) => start(e, 'rotate', i)}
        title="rotate"
        className="absolute -left-2 -top-2 size-3.5 -translate-x-full -translate-y-full cursor-grab rounded-full border border-white bg-sky-400"
      />
      <span
        onPointerDown={(e) => start(e, 'resize', i)}
        title="resize"
        className="absolute -bottom-1.5 -right-1.5 size-3.5 cursor-nwse-resize border border-white bg-emerald-400"
      />
      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation()
          toggleShape(i)
        }}
        title="convert to polygon"
        className="absolute -right-1 -top-2 -translate-y-full bg-[#1c1b1b] px-1 text-[9px] font-bold uppercase text-[#ffb595] ghost-border"
      >
        shape
      </button>
    </div>
  )
}

function PolyBox({
  o,
  i,
  start,
  addVertex,
  removeVertex,
  toggleShape,
}: {
  o: ForgeObject
  i: number
  start: StartFn
  addVertex: (i: number, edge: number) => void
  removeVertex: (i: number, vi: number) => void
  toggleShape: (i: number) => void
}) {
  const pts = o.points!
  const b = polyBounds(pts)
  return (
    <>
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <polygon
          points={pts.map((p) => p.join(',')).join(' ')}
          fill="rgba(202,89,36,0.15)"
          stroke="#ca5924"
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      {pts.map((p, vi) => {
        const n = pts[(vi + 1) % pts.length]
        return (
          <span
            key={`e${vi}`}
            onPointerDown={(e) => {
              e.preventDefault()
              e.stopPropagation()
              addVertex(i, vi)
            }}
            title="add a corner"
            style={{ left: `${(p[0] + n[0]) / 2}%`, top: `${(p[1] + n[1]) / 2}%` }}
            className="absolute size-2.5 -translate-x-1/2 -translate-y-1/2 cursor-copy rounded-full border border-white/70 bg-sky-300/90"
          />
        )
      })}

      {pts.map((p, vi) => (
        <span
          key={`v${vi}`}
          onPointerDown={(e) => {
            if (e.shiftKey) {
              e.preventDefault()
              e.stopPropagation()
              removeVertex(i, vi)
            } else {
              start(e, 'vertex', i, vi)
            }
          }}
          title="drag to move · shift-click to remove"
          style={{ left: `${p[0]}%`, top: `${p[1]}%` }}
          className="absolute size-3.5 -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-full border-2 border-white bg-amber-400"
        />
      ))}

      <span
        onPointerDown={(e) => start(e, 'polymove', i)}
        title="move whole shape"
        style={{ left: `${b.cx}%`, top: `${b.cy}%` }}
        className="absolute size-5 -translate-x-1/2 -translate-y-1/2 cursor-move rounded-full border-2 border-white bg-[#ca5924]/90"
      />
      <span
        onPointerDown={(e) => start(e, 'rotate', i)}
        title="rotate label"
        style={{ left: `${b.minX}%`, top: `${b.minY}%` }}
        className="absolute size-3.5 -translate-x-full -translate-y-full cursor-grab rounded-full border border-white bg-sky-400"
      />
      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation()
          toggleShape(i)
        }}
        title="back to a rectangle"
        style={{ left: `${b.maxX}%`, top: `${b.minY}%` }}
        className="absolute -translate-y-1/2 bg-[#1c1b1b] px-1 text-[9px] font-bold uppercase text-[#ffb595] ghost-border"
      >
        rect
      </button>
    </>
  )
}

function LabelHandle({ o, i, start }: { o: ForgeObject; i: number; start: StartFn }) {
  const c = o.lx != null && o.ly != null ? { lx: o.lx, ly: o.ly } : labelCenter(o)
  return (
    <span
      onPointerDown={(e) => start(e, 'label', i)}
      title="drag to move the label"
      style={{ left: `${c.lx}%`, top: `${c.ly}%`, transform: `translate(-50%, -50%) rotate(${o.rot ?? 0}deg)` }}
      className="absolute z-20 cursor-move whitespace-nowrap bg-[#0e0a07]/85 px-2.5 py-1 font-headline text-[10px] uppercase tracking-[0.25em] text-[#ffb595] ring-1 ring-sky-400/70"
    >
      {o.label}
    </span>
  )
}

function TourEditor() {
  const [boxes, setBoxes] = useState(() =>
    OBJECTS.filter((o) => o.tour).map((o) => ({ id: o.id, label: o.label, ...(o.tbox ?? autoTourBox(o)) })),
  )
  const drag = useRef<{
    mode: 'move' | 'resize'
    i: number
    sx: number
    sy: number
    box: { x: number; y: number; w: number; h: number }
  } | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    function move(e: PointerEvent) {
      const d = drag.current
      if (!d) return
      const dx = ((e.clientX - d.sx) / window.innerWidth) * 100
      const dy = ((e.clientY - d.sy) / window.innerHeight) * 100
      const r1 = (v: number) => Math.round(v * 10) / 10
      setBoxes((prev) =>
        prev.map((b, idx) => {
          if (idx !== d.i) return b
          if (d.mode === 'move') return { ...b, x: r1(d.box.x + dx), y: r1(d.box.y + dy) }
          return { ...b, w: Math.max(2, r1(d.box.w + dx)), h: Math.max(2, r1(d.box.h + dy)) }
        }),
      )
    }
    function up() {
      drag.current = null
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
  }, [])

  function start(e: React.PointerEvent, mode: 'move' | 'resize', i: number) {
    e.preventDefault()
    e.stopPropagation()
    const b = boxes[i]
    drag.current = { mode, i, sx: e.clientX, sy: e.clientY, box: { x: b.x, y: b.y, w: b.w, h: b.h } }
  }

  const exported = boxes.map((b) => `${b.id}: tbox { x: ${b.x}, y: ${b.y}, w: ${b.w}, h: ${b.h} }`).join('\n')

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#0e0e0e]">
      <img src="/dashboard.png" alt="" className="pointer-events-none absolute inset-0 h-full w-full object-fill" />
      {boxes.map((b, i) => (
        <div
          key={b.id}
          onPointerDown={(e) => start(e, 'move', i)}
          style={{ left: `${b.x}%`, top: `${b.y}%`, width: `${b.w}%`, height: `${b.h}%` }}
          className="absolute cursor-move border-2 border-sky-400 bg-sky-400/15"
        >
          <span className="pointer-events-none absolute left-0.5 top-0.5 whitespace-nowrap bg-black/75 px-1 font-mono text-[9px] leading-tight text-white">
            {b.label} · {b.x},{b.y} · {b.w}×{b.h}
          </span>
          <span
            onPointerDown={(e) => start(e, 'resize', i)}
            title="resize"
            className="absolute -bottom-1.5 -right-1.5 size-3.5 cursor-nwse-resize border border-white bg-emerald-400"
          />
        </div>
      ))}
      <button
        type="button"
        onClick={() => {
          navigator.clipboard?.writeText(exported).then(
            () => {
              setCopied(true)
              window.setTimeout(() => setCopied(false), 1500)
            },
            () => {},
          )
        }}
        className="absolute bottom-4 left-4 z-40 bg-[#1c1b1b] px-2.5 py-1 font-mono text-[10px] lowercase text-sky-300 ghost-border transition-colors hover:bg-[#252423]"
      >
        {copied ? 'copied!' : 'copy'}
      </button>
    </div>
  )
}

ForgeScene.layout = (page: ReactNode) => page
