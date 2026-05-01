import { useEffect, useLayoutEffect, useState } from 'react'

interface Props {
  onDone: () => void
}

interface Point {
  x: number
  y: number
}

const DURATION_MS = 3200

export default function OnboardingCelebration({ onDone }: Props) {
  const [target, setTarget] = useState<Point | null>(null)

  useLayoutEffect(() => {
    const el = document.querySelector('[data-tour="streak-target"]') as HTMLElement | null
    if (el) {
      const r = el.getBoundingClientRect()
      setTarget({ x: r.left + r.width / 2, y: r.top + r.height / 2 })
    } else {
      setTarget({ x: 32, y: window.innerHeight - 80 })
    }
  }, [])

  useEffect(() => {
    const id = window.setTimeout(onDone, DURATION_MS)
    return () => window.clearTimeout(id)
  }, [onDone])

  if (!target) return null

  const startX = window.innerWidth / 2
  const startY = window.innerHeight / 2

  const sparks = Array.from({ length: 36 }, (_, i) => i)

  return (
    <div className="fixed inset-0 z-[200] pointer-events-none overflow-hidden">
      <div className="absolute inset-0 animate-[forge-flash_3200ms_ease-out_forwards] bg-[radial-gradient(ellipse_at_bottom,rgba(238,103,28,0.6)_0%,rgba(238,103,28,0.25)_30%,rgba(0,0,0,0)_72%)]" />

      <div className="absolute bottom-0 left-0 right-0 h-3/4 overflow-hidden">
        {sparks.map((i) => {
          const left = (i / sparks.length) * 100 + (Math.random() * 6 - 3)
          const delay = Math.random() * 1400
          const duration = 1600 + Math.random() * 900
          const size = 6 + Math.random() * 16
          const drift = Math.random() * 100 - 50
          return (
            <span
              key={i}
              className="absolute bottom-0 rounded-full"
              style={
                {
                  left: `${left}%`,
                  width: size,
                  height: size,
                  background: 'radial-gradient(circle, #ffe2c8 0%, #ee671c 55%, rgba(238,103,28,0) 100%)',
                  animation: `forge-spark ${duration}ms ease-out ${delay}ms forwards`,
                  ['--drift' as string]: `${drift}px`,
                } as React.CSSProperties
              }
            />
          )
        })}
      </div>

      <div
        className="absolute leading-none"
        style={
          {
            left: 0,
            top: 0,
            transform: `translate(${startX - 90}px, ${startY - 90}px)`,
            animation: `forge-coin-fly ${DURATION_MS}ms cubic-bezier(0.55, 0.05, 0.4, 1) forwards`,
            filter: 'drop-shadow(0 0 28px rgba(238,103,28,0.9))',
            ['--end-x' as string]: `${target.x - 90}px`,
            ['--end-y' as string]: `${target.y - 90}px`,
          } as React.CSSProperties
        }
      >
        <span className="forge-celebration-coin w-[180px] h-[180px] bg-[#0e0e0e] shadow-[0_0_40px_rgba(238,103,28,0.7)] flex items-center justify-center border border-[#ee671c]/40">
          <span
            className="material-symbols-outlined text-[#ffb595] leading-none"
            style={{
              fontSize: '170px',
              fontVariationSettings: "'FILL' 1, 'wght' 500, 'opsz' 48",
            }}
          >
            local_fire_department
          </span>
        </span>
      </div>

      <style>{`
        .forge-celebration-coin { border-radius: 9999px !important; overflow: hidden; line-height: 0; }
        @keyframes forge-flash {
          0% { opacity: 0; }
          10% { opacity: 1; }
          75% { opacity: 0.55; }
          100% { opacity: 0; }
        }
        @keyframes forge-spark {
          0% { transform: translate(0, 0) scale(1); opacity: 0; }
          12% { opacity: 1; }
          100% { transform: translate(var(--drift, 0), -90vh) scale(0.4); opacity: 0; }
        }
        @keyframes forge-coin-glow {
          0%, 100% { opacity: 0.7; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.25); }
        }
        @keyframes forge-coin-fly {
          0% {
            transform: translate(${startX - 90}px, ${startY - 90}px) scale(0.2) rotate(0deg);
            opacity: 0;
          }
          12% {
            transform: translate(${startX - 90}px, ${startY - 90}px) scale(1.4) rotate(540deg);
            opacity: 1;
          }
          25% {
            transform: translate(${startX - 90}px, ${startY - 90}px) scale(1.1) rotate(1440deg);
            opacity: 1;
          }
          88% {
            transform: translate(var(--end-x), var(--end-y)) scale(0.35) rotate(3960deg);
            opacity: 1;
          }
          100% {
            transform: translate(var(--end-x), var(--end-y)) scale(0.1) rotate(4320deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}
