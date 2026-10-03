import { useEffect, useRef, useState } from 'react'

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

const HANDLES: { mode: DragMode; className: string }[] = [
  { mode: 'nw', className: 'top-0 left-0 cursor-nwse-resize' },
  { mode: 'ne', className: 'top-0 right-0 cursor-nesw-resize' },
  { mode: 'sw', className: 'bottom-0 left-0 cursor-nesw-resize' },
  { mode: 'se', className: 'bottom-0 right-0 cursor-nwse-resize' },
]

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function nextCrop(mode: DragMode, origin: CropRegion, dx: number, dy: number): CropRegion {
  if (mode === 'move') {
    return {
      ...origin,
      x: clamp(origin.x + dx, 0, 1 - origin.width),
      y: clamp(origin.y + dy, 0, 1 - origin.height),
    }
  }

  const right = origin.x + origin.width
  const bottom = origin.y + origin.height
  let { x, y, width, height } = origin

  if (mode === 'nw' || mode === 'sw') {
    x = clamp(origin.x + dx, 0, right - MIN_SIZE)
    width = right - x
  } else {
    width = clamp(origin.width + dx, MIN_SIZE, 1 - x)
  }

  if (mode === 'nw' || mode === 'ne') {
    y = clamp(origin.y + dy, 0, bottom - MIN_SIZE)
    height = bottom - y
  } else {
    height = clamp(origin.height + dy, MIN_SIZE, 1 - y)
  }

  return { x, y, width, height }
}

export default function CoverImageCropper({ src, busy, onCancel, onCrop }: Props) {
  const frameRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ mode: DragMode; startX: number; startY: number; origin: CropRegion } | null>(null)
  const [crop, setCrop] = useState<CropRegion>(FULL_CROP)

  useEffect(() => {
    function onPointerMove(e: PointerEvent) {
      const drag = dragRef.current
      const frame = frameRef.current
      if (!drag || !frame) return
      const rect = frame.getBoundingClientRect()
      if (!rect.width || !rect.height) return
      setCrop(
        nextCrop(
          drag.mode,
          drag.origin,
          (e.clientX - drag.startX) / rect.width,
          (e.clientY - drag.startY) / rect.height,
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

  const isFullCrop = crop.width > 0.999 && crop.height > 0.999

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1c1b1b] ghost-border max-w-3xl w-full p-8 space-y-6">
        <div>
          <h3 className="text-xl font-headline font-bold text-[#e5e2e1] mb-2">Crop Cover Image</h3>
          <p className="text-stone-400 text-sm">Drag the corners to pick the part of the image you want to keep.</p>
        </div>

        <div className="bg-[#0e0e0e] p-4 flex justify-center">
          <div ref={frameRef} className="relative select-none touch-none overflow-hidden">
            <img src={src} alt="" draggable={false} className="block max-h-[50vh] max-w-full select-none" />
            <div
              onPointerDown={(e) => startDrag(e, 'move')}
              className="absolute border border-[#ffb595] cursor-move"
              style={{
                left: `${crop.x * 100}%`,
                top: `${crop.y * 100}%`,
                width: `${crop.width * 100}%`,
                height: `${crop.height * 100}%`,
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
          </div>
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
