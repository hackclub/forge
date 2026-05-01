import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { router } from '@inertiajs/react'
import OnboardingCelebration from '@/components/OnboardingCelebration'

type DinoKey = 'wave' | 'glasses' | 'thumbsup' | 'destroyer' | 'aaa' | 'docs' | 'rich'

const DINOS: Record<DinoKey, string> = {
  wave: '/dino_images/hyper-dino-wave.gif',
  glasses: '/dino_images/glasses_dino.png',
  thumbsup: '/dino_images/orph_cool_thumbsup.png',
  destroyer: '/dino_images/destroyer_dino.png',
  aaa: '/dino_images/aaa_dino.png',
  docs: '/dino_images/docs_dino.png',
  rich: '/dino_images/rich_dino.png',
}

const ROTATION: DinoKey[] = ['glasses', 'thumbsup', 'destroyer', 'aaa']

interface Step {
  target?: string
  dino?: DinoKey
  title: string
  body: string
}

const steps: Step[] = [
  {
    dino: 'wave',
    title: `Welcome forger, to the forge`,
    body: `I'm Orph or the Forge Keeper around here. Let me give you the quick tour of the workshop, be aware the forge isn't for beginers so be careful in where you tread, this will only take a minute (or a couple days) and then you can start building projects`,
  },
  {
    target: '[data-tour="nav-dashboard"]',
    title: `The forge base`,
    body: `This is home base. Your projects, quests, important info everything lies here so ya better get comfy because your going to be here for most of your time in the forge`,
  },
  {
    target: '[data-tour="nav-explore"]',
    title: `Discover what others are building`,
    body: `Stuck for ideas like Aarav? The Discover area shows what other forger's are forging right now. Steal inspiration shamelessly (atleast thats what aarav does) feel free to doom scroll here as well, no phones gonna be allowed in tha forge!`,
  },
  {
    title: `a 101 on how to make money with orph (you wish you had this irl)`,
    body: `Wanna get rich? Wanna make something fun? Theres 2 ways to do that (or 3), the first way is through making projects - head over to the docs for more info or wait for the next step :), the second way is referalls! If you bring more of your friends to the forge you can earn some cold hard casssshh`,
  },
  {
    target: '[data-tour="dashboard-new-project"], [data-tour="new-project"]',
    title: `Tiers - fancy fancy`,
    body: `Around these parts, 2 things define how much you get per project, the first one is tiers - a tier 4 project will earn you a decent amount for decent amount of work, likewise a tier 1 earns you a lot equiavalent to the work you put in, the second way - don't get robbed around these parts`,
  },
  {
    target: '[data-tour="dashboard-new-project"], [data-tour="new-project"]',
    title: `Pitches - the secret to success`,
    body: `Ever had a project thats failed? Ever wanted more opinons and chatter abour your project? Introducing the forgery, the forgery is a special part of the forge that you pitch your idea,pitches help you to interact with the community on slack a about your idea and are the pathway to get unlimited funding from tier 1 (read the docs for more)`,
  },
  {
    target: '[data-tour="dashboard-quest"]',
    title: `Orph's Quest - oooo a fancy quest`,
    body: `OHOHOHOHO the first quest has begun! Quests are weekly community challenges that reward you with badges and coins. Head to Settings > Public Profile to view them.Since this first quest is a community quest, progress from other people’s projects will also contribute to your quest bar!`,
  },
  {
    target: '[data-tour="dashboard-quest"]',
    title: `Your first quest`,
    body: `Build any project and ship it. That's it. Once it's approved you'll earn your first coins and a badge to prove you belong here. Progress from other peoples quest bar also fills up the bar and likewise for you!`,
  },
  {
    target: '[data-tour="nav-shop"]',
    dino: 'rich',
    title: `The Shop - aka the rich people palace`,
    body: `Coins from approved ships are spendable in the Shop on parts for your next build AND some cool stuff like Ipads and 3D printers!!! Keep your daily streak going for a multiplier on what you earn as well as a standing on the leaderboards.`,
  },
  {
    target: '[data-tour="nav-docs"]',
    dino: 'docs',
    title: `Need a hand? (not a real one sorry im not a magician)`,
    body: `The resources page has EVERYTHING you need, if its not there spam ping the child who's fault it is in slack (@cybdo looking at you), If your question is still unanswered feel free to dm me @Aarav J on slack or ask in #forge-help where one of our team members will reply as soon as we can!`,
  },
  {
    title: `Now go forge something!!`,
    body: `walk carefully, @cybdo forgot to oil the elevator so you mayyy wanna watch out anyway that's the tour. think of an idea, pick a tier, ship something cool I'm rooting for ya. See you in the workshop. (pls don't get lost or injured)`,
  },
]

function dinoForStep(index: number): DinoKey {
  const explicit = steps[index].dino
  if (explicit) return explicit
  let rotationIdx = 0
  for (let i = 1; i < index; i += 1) {
    if (!steps[i].dino) rotationIdx += 1
  }
  return ROTATION[rotationIdx % ROTATION.length]
}

function useTypewriter(text: string, speed = 14) {
  const [displayed, setDisplayed] = useState('')
  const intervalRef = useRef<number | null>(null)

  useEffect(() => {
    setDisplayed('')
    let i = 0
    intervalRef.current = window.setInterval(() => {
      i += 1
      setDisplayed(text.slice(0, i))
      if (i >= text.length && intervalRef.current !== null) {
        window.clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }, speed)
    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [text, speed])

  const done = displayed.length >= text.length
  const skip = () => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setDisplayed(text)
  }
  return { displayed, done, skip }
}

interface Rect {
  top: number
  left: number
  width: number
  height: number
}

function useTargetRect(selector: string | undefined) {
  const [rect, setRect] = useState<Rect | null>(null)

  useLayoutEffect(() => {
    if (!selector) {
      setRect(null)
      return
    }

    let frame = 0
    let cancelled = false

    function measure() {
      if (cancelled) return
      const el = document.querySelector(selector!) as HTMLElement | null
      if (!el) {
        setRect(null)
        return
      }
      const r = el.getBoundingClientRect()
      const visible =
        r.width > 0 &&
        r.height > 0 &&
        r.right > 0 &&
        r.bottom > 0 &&
        r.left < window.innerWidth &&
        r.top < window.innerHeight
      if (!visible) {
        setRect(null)
        return
      }
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
    }

    const el = document.querySelector(selector) as HTMLElement | null
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }

    measure()
    const tick = () => {
      measure()
      frame = window.requestAnimationFrame(tick)
    }
    frame = window.requestAnimationFrame(tick)

    window.addEventListener('resize', measure)
    return () => {
      cancelled = true
      window.cancelAnimationFrame(frame)
      window.removeEventListener('resize', measure)
    }
  }, [selector])

  return rect
}

export default function OnboardingModal() {
  const [stepIndex, setStepIndex] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [celebrating, setCelebrating] = useState(false)
  const step = steps[stepIndex]
  const isLast = stepIndex === steps.length - 1
  const dinoKey = dinoForStep(stepIndex)
  const rect = useTargetRect(step.target)
  const { displayed, done, skip } = useTypewriter(step.body)
  const cardRef = useRef<HTMLDivElement | null>(null)
  const [cardSize, setCardSize] = useState({ width: 720, height: 280 })

  useLayoutEffect(() => {
    if (!cardRef.current) return
    const r = cardRef.current.getBoundingClientRect()
    setCardSize({ width: r.width, height: r.height })
  }, [stepIndex, displayed])

  const placement = useMemo(() => {
    const margin = 16
    const vw = typeof window === 'undefined' ? 1024 : window.innerWidth
    const vh = typeof window === 'undefined' ? 768 : window.innerHeight

    if (!rect) {
      return {
        top: Math.max(margin, vh / 2 - cardSize.height / 2),
        left: Math.max(margin, vw / 2 - cardSize.width / 2),
        centered: true,
      }
    }

    const targetCenterY = rect.top + rect.height / 2
    const spaceRight = vw - (rect.left + rect.width)
    const spaceLeft = rect.left
    const spaceBelow = vh - (rect.top + rect.height)

    let left: number
    let top: number

    if (spaceRight >= cardSize.width + margin) {
      left = rect.left + rect.width + margin
      top = targetCenterY - cardSize.height / 2
    } else if (spaceLeft >= cardSize.width + margin) {
      left = rect.left - cardSize.width - margin
      top = targetCenterY - cardSize.height / 2
    } else if (spaceBelow >= cardSize.height + margin) {
      left = Math.max(margin, rect.left + rect.width / 2 - cardSize.width / 2)
      top = rect.top + rect.height + margin
    } else {
      left = Math.max(margin, rect.left + rect.width / 2 - cardSize.width / 2)
      top = Math.max(margin, rect.top - cardSize.height - margin)
    }

    left = Math.min(Math.max(margin, left), vw - cardSize.width - margin)
    top = Math.min(Math.max(margin, top), vh - cardSize.height - margin)
    return { top, left, centered: false }
  }, [rect, cardSize])

  function finish() {
    if (submitting) return
    setSubmitting(true)
    router.post(
      '/onboarding/complete',
      {},
      {
        preserveScroll: false,
        preserveState: false,
        replace: true,
        onError: () => setSubmitting(false),
      }
    )
  }

  function next() {
    if (!done) {
      skip()
      return
    }
    if (isLast) {
      setCelebrating(true)
    } else {
      setStepIndex((i) => i + 1)
    }
  }

  function back() {
    if (stepIndex > 0) setStepIndex((i) => i - 1)
  }

  const highlightPad = 8

  if (celebrating) {
    return <OnboardingCelebration onDone={finish} />
  }

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none">
      {rect ? (
        <>
          <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'auto' }}>
            <defs>
              <mask id="tour-mask">
                <rect width="100%" height="100%" fill="white" />
                <rect
                  x={rect.left - highlightPad}
                  y={rect.top - highlightPad}
                  width={rect.width + highlightPad * 2}
                  height={rect.height + highlightPad * 2}
                  fill="black"
                />
              </mask>
            </defs>
            <rect width="100%" height="100%" fill="rgba(0,0,0,0.78)" mask="url(#tour-mask)" />
          </svg>
          <div
            className="absolute pointer-events-none"
            style={{
              top: rect.top - highlightPad,
              left: rect.left - highlightPad,
              width: rect.width + highlightPad * 2,
              height: rect.height + highlightPad * 2,
              boxShadow: '0 0 0 2px #ee671c, 0 0 0 6px rgba(238,103,28,0.25), 0 0 30px rgba(238,103,28,0.45)',
              animation: 'tour-pulse 1.6s ease-in-out infinite',
              transition: 'all 250ms ease',
            }}
          />
        </>
      ) : (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm pointer-events-auto" />
      )}

      <div
        ref={cardRef}
        className="absolute pointer-events-auto bg-[#1c1b1b] ghost-border w-[min(95vw,720px)] transition-[top,left] duration-300 ease-out"
        style={{ top: placement.top, left: placement.left }}
      >
        <div className="p-3 sm:p-4 flex flex-col sm:flex-row items-stretch gap-3 sm:gap-4">
          <img
            key={dinoKey}
            src={DINOS[dinoKey]}
            alt="Orph the dino"
            className="w-24 sm:w-28 self-center sm:self-stretch object-contain shrink-0 animate-[tour-bounce_500ms_ease-out]"
          />
          <div className="flex-1 w-full min-w-0 relative">
            <div className="hidden sm:block absolute -left-[12px] top-4 w-0 h-0 border-y-[7px] border-y-transparent border-r-[9px] border-r-[#0e0e0e]" />
            <div className="bg-[#0e0e0e] ghost-border p-3 sm:p-4 h-full flex flex-col">
              <p className="text-[9px] uppercase tracking-[0.2em] font-bold text-stone-500 mb-1.5">
                Step {stepIndex + 1} of {steps.length}
              </p>
              <h2 className="text-base font-headline font-bold text-[#e5e2e1] tracking-tight mb-1.5">
                {step.title}
              </h2>
              <p className="text-stone-400 text-[13px] leading-snug h-[5.5em] overflow-hidden line-clamp-4">
                {displayed}
                {!done && <span className="inline-block w-[6px] h-[12px] -mb-[2px] ml-[1px] bg-[#ffb595] animate-[tour-blink_900ms_steps(2)_infinite]" />}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 px-3 sm:px-4 pb-3 pt-1">
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={back}
              disabled={stepIndex === 0 || submitting}
              className="ghost-border bg-[#1c1b1b] text-stone-400 hover:bg-[#2a2a2a] px-3 py-1.5 font-bold uppercase tracking-wider text-[10px] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer corner-accents"
            >
              Back
            </button>
            <button
              type="button"
              onClick={finish}
              disabled={submitting}
              className="text-stone-500 hover:text-[#ffb595] transition-colors text-[10px] font-bold uppercase tracking-[0.2em] disabled:opacity-50 cursor-pointer px-2"
            >
              Skip
            </button>
          </div>
          <div className="flex items-center gap-1 flex-wrap justify-center flex-1 min-w-0">
            {steps.map((_, i) => (
              <span
                key={i}
                className={`h-[3px] transition-all ${
                  i === stepIndex
                    ? 'w-5 bg-[#ee671c]'
                    : i < stepIndex
                      ? 'w-2.5 bg-[#ffb595]/60'
                      : 'w-2.5 bg-stone-700'
                }`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={next}
            disabled={submitting}
            className="signature-smolder text-[#4c1a00] px-3 py-1.5 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shrink-0 corner-accents"
          >
            {!done ? 'Skip' : isLast ? 'Enter the forge' : 'Next'}
            <span className="material-symbols-outlined text-sm">
              {!done ? 'fast_forward' : isLast ? 'local_fire_department' : 'arrow_forward'}
            </span>
          </button>
        </div>
      </div>

      <style>{`
        @keyframes tour-pulse {
          0%, 100% { box-shadow: 0 0 0 2px #ee671c, 0 0 0 6px rgba(238,103,28,0.25), 0 0 30px rgba(238,103,28,0.45); }
          50% { box-shadow: 0 0 0 2px #ee671c, 0 0 0 10px rgba(238,103,28,0.15), 0 0 50px rgba(238,103,28,0.65); }
        }
        @keyframes tour-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes tour-bounce {
          0% { transform: translateY(8px) scale(0.92); opacity: 0; }
          60% { transform: translateY(-3px) scale(1.02); opacity: 1; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
