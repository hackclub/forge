import { useEffect, useLayoutEffect, useRef, useState } from 'react'

export type CropRegion = { x: number; y: number; width: number; height: number }

type DragMode = 'move' | 'nw' | 'ne' | 'sw' | 'se'

type Props = {
  src: string
  busy: boolean
  onCancel: () => void
  onCrop: (crop: CropRegion) => void
}

const FULL_CROP: CropRegion = { x: 0, y: 0, width: 1, height: 1 }
const MIN_SIZE = 0.05
const MAX_SIZE = 5
const MIN_ZOOM = 0.25
const MAX_ZOOM = 4
const VIEWPORT_HEIGHT = 340

const HANDLES: { mode: DragMode; className: string }[] = [
  { mode: 'nw', className: '-top-1.5 -left-1.5 cursor-nwse-resize' },
  { mode: 'ne', className: '-top-1.5 -right-1.5 cursor-nesw-resize' },
  { mode: 'sw', className: '-bottom-1.5 -left-1.5 cursor-nesw-resize' },
  { mode: 'se', className: '-bottom-1.5 -right-1.5 cursor-nwse-resize' },
]

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function nextCrop(mode: DragMode, origin: CropRegion, dx: number, dy: number): CropRegion {
  if (mode === 'move') {
    return { ...origin, x: clamp(origin.x + dx, -MAX_SIZE, MAX_SIZE), y: clamp(origin.y + dy, -MAX_SIZE, MAX_SIZE) }
  }

  const right = origin.x + origin.width
  const bottom = origin.y + origin.height
  let { x, y, width, height } = origin

  if (mode === 'nw' || mode === 'sw') {
    x = clamp(origin.x + dx, right - MAX_SIZE, right - MIN_SIZE)
    width = right - x
  } else {
    width = clamp(origin.width + dx, MIN_SIZE, MAX_SIZE)
  }

  if (mode === 'nw' || mode === 'ne') {
    y = clamp(origin.y + dy, bottom - MAX_SIZE, bottom - MIN_SIZE)
    height = bottom - y
  } else {
    height = clamp(origin.height + dy, MIN_SIZE, MAX_SIZE)
  }

  return { x, y, width, height }
}

function scaleAroundCentre(crop: CropRegion, factor: number): CropRegion {
  const width = clamp(crop.width * factor, MIN_SIZE, MAX_SIZE)
  const height = clamp(crop.height * factor, MIN_SIZE, MAX_SIZE)
  return {
    x: crop.x + crop.width / 2 - width / 2,
    y: crop.y + crop.height / 2 - height / 2,
    width,
    height,
  }
}

export default function CoverImageCropper({ src, busy, onCancel, onCrop }: Props) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ mode: DragMode; startX: number; startY: number; origin: CropRegion } | null>(null)
  const layoutRef = useRef({ imageWidth: 1, imageHeight: 1 })
  const [crop, setCrop] = useState<CropRegion>(FULL_CROP)
  const [natural, setNatural] = useState<{ width: number; height: number } | null>(null)
  const [viewportWidth, setViewportWidth] = useState(0)

  useLayoutEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return
    const observer = new ResizeObserver(() => setViewportWidth(viewport.clientWidth))
    observer.observe(viewport)
    setViewportWidth(viewport.clientWidth)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    function onPointerMove(e: PointerEvent) {
      const drag = dragRef.current
      const { imageWidth, imageHeight } = layoutRef.current
      if (!drag || !imageWidth || !imageHeight) return
      setCrop(
        nextCrop(
          drag.mode,
          drag.origin,
          (e.clientX - drag.startX) / imageWidth,
          (e.clientY - drag.startY) / imageHeight,
        ),
      )
    }

    function onPointerUp() {
      dragRef.current = null
    }

    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
    }
  }, [])

  function startDrag(e: React.PointerEvent, mode: DragMode) {
    if (busy) return
    e.preventDefault()
    e.stopPropagation()
    dragRef.current = { mode, startX: e.clientX, startY: e.clientY, origin: crop }
  }

  // Lay the image out in "image units" (the image spans 0..1 wide, 0..aspect tall) so the
  // selection can sit outside it, then fit image + selection together into the viewport.
  const unitHeight = natural ? natural.height / natural.width : 1
  const minX = Math.min(0, crop.x)
  const minY = Math.min(0, crop.y * unitHeight)
  const maxX = Math.max(1, crop.x + crop.width)
  const maxY = Math.max(unitHeight, (crop.y + crop.height) * unitHeight)
  const scale = viewportWidth > 0 ? Math.min(viewportWidth / (maxX - minX), VIEWPORT_HEIGHT / (maxY - minY)) : 0
  const originX = (viewportWidth - (maxX - minX) * scale) / 2 - minX * scale
  const originY = (VIEWPORT_HEIGHT - (maxY - minY) * scale) / 2 - minY * scale

  layoutRef.current = { imageWidth: scale, imageHeight: unitHeight * scale }

  const zoom = 1 / crop.width
  const isFullCrop = Math.abs(crop.x) < 0.001 && Math.abs(crop.y) < 0.001 && crop.width > 0.999 && crop.height > 0.999

  function applyZoom(nextZoom: number) {
    setCrop((current) => scaleAroundCentre(current, 1 / nextZoom / current.width))
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1c1b1b] ghost-border max-w-3xl w-full p-8 space-y-6">
        <div>
          <h3 className="text-xl font-headline font-bold text-[#e5e2e1] mb-2">Crop Cover Image</h3>
          <p className="text-stone-400 text-sm">
            Drag the corners to pick what you keep. Zoom out past the edges to letterbox the image instead of cutting it
            — the extra space is left transparent.
          </p>
        </div>

        <div
          ref={viewportRef}
          className="relative bg-[#0e0e0e] overflow-hidden select-none touch-none"
          style={{ height: VIEWPORT_HEIGHT }}
        >
          <img
            src={src}
            alt=""
            draggable={false}
            onLoad={(e) => setNatural({ width: e.currentTarget.naturalWidth, height: e.currentTarget.naturalHeight })}
            className="absolute select-none max-w-none"
            style={{ left: originX, top: originY, width: scale, height: unitHeight * scale }}
          />
          {scale > 0 && (
            <div
              onPointerDown={(e) => startDrag(e, 'move')}
              className="absolute border border-[#ffb595] cursor-move"
              style={{
                left: originX + crop.x * scale,
                top: originY + crop.y * unitHeight * scale,
                width: crop.width * scale,
                height: crop.height * unitHeight * scale,
                boxShadow: '0 0 0 9999px rgba(0,0,0,0.6)',
              }}
            >
              {HANDLES.map((handle) => (
                <div
                  key={handle.mode}
                  onPointerDown={(e) => startDrag(e, handle.mode)}
                  className={`absolute w-3 h-3 bg-[#ffb595] ${handle.className}`}
                />
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-500 shrink-0">Zoom</span>
          <input
            type="range"
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step={0.01}
            value={clamp(zoom, MIN_ZOOM, MAX_ZOOM)}
            onChange={(e) => applyZoom(Number(e.target.value))}
            disabled={busy}
            className="flex-1 accent-[#ca5924] cursor-pointer"
          />
          <span className="text-xs font-mono text-stone-400 w-12 text-right shrink-0">{Math.round(zoom * 100)}%</span>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setCrop(FULL_CROP)}
            disabled={busy}
            className="ghost-border bg-[#1c1b1b] hover:bg-[#2a2a2a] text-stone-400 font-headline font-bold px-4 py-2 uppercase tracking-wider text-sm transition-colors disabled:opacity-50 cursor-pointer"
          >
            Reset
          </button>
          <button
            onClick={onCancel}
            disabled={busy}
            className="flex-1 bg-stone-700/40 hover:bg-stone-700/60 text-stone-400 font-headline font-bold py-2 uppercase tracking-wider text-sm transition-colors disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => onCrop(crop)}
            disabled={busy || isFullCrop}
            className="flex-1 signature-smolder text-[#4c1a00] font-headline font-bold py-2 uppercase tracking-wider text-sm active:scale-95 transition-transform disabled:opacity-50 cursor-pointer"
          >
            {busy ? 'Cropping...' : 'Apply Crop'}
          </button>
        </div>
      </div>
    </div>
  )
}
