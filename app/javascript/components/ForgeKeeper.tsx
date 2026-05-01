import { useEffect, useRef, useState } from 'react'
import { Link } from '@inertiajs/react'

type Emotion = 'neutral' | 'happy' | 'sad' | 'angry'

interface Message {
  role: 'assistant' | 'user'
  content: string
  emotion?: Emotion
}

interface Props {
  userName: string
}

const GREETING = `welcome to the forge forger, i see ya made it here unharmed. try not to break anything important on day one yeah? the hammer's on the bench when you're ready to swing at something.`

const NEUTRAL_DINOS = [
  '/dino_images/strong_dino_1.png',
  '/dino_images/strong_dino_2.png',
  '/dino_images/destroyer_dino.png',
]

function randomNeutral(): string {
  return NEUTRAL_DINOS[Math.floor(Math.random() * NEUTRAL_DINOS.length)]
}

const EMOTION_DINOS: Record<Exclude<Emotion, 'neutral'>, string> = {
  happy: '/dino_images/happy_dino.png',
  sad: '/dino_images/sad_dino.png',
  angry: '/dino_images/angry_dino.png',
}

function dinoForMessage(emotion: Emotion | undefined, fallback: string): string {
  if (!emotion || emotion === 'neutral') return fallback
  return EMOTION_DINOS[emotion]
}

function getCsrfToken(): string {
  const meta = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
  return meta?.content ?? ''
}

const STORAGE_KEY = 'forge_keeper_state_v1'

interface PersistedState {
  messages: Message[]
  unread: boolean
  emotion: Emotion
}

function loadPersisted(): PersistedState | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as PersistedState
  } catch {
    return null
  }
}

function savePersisted(state: PersistedState) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    void 0
  }
}

const TOKEN_REGEX = /(\[[^\]\n]+\]\([^)\s]+\))|(https?:\/\/[^\s)]+)/gi
const INTERNAL_LINK = /^\/(?!\/)/

function renderInline(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = []
  let lastIndex = 0
  let key = 0

  for (const match of text.matchAll(TOKEN_REGEX)) {
    const idx = match.index ?? 0
    if (idx > lastIndex) nodes.push(text.slice(lastIndex, idx))

    const [whole, mdLink, externalUrl] = match

    if (mdLink) {
      const inner = mdLink.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
      if (inner) {
        const [, label, href] = inner
        nodes.push(renderLink(href, label, key++))
      } else {
        nodes.push(whole)
      }
    } else if (externalUrl) {
      nodes.push(renderLink(externalUrl, prettyExternalLabel(externalUrl), key++))
    }

    lastIndex = idx + whole.length
  }

  if (lastIndex < text.length) nodes.push(text.slice(lastIndex))
  return nodes
}

function prettyExternalLabel(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

function renderLink(href: string, label: string, key: number): React.ReactNode {
  const isInternal = INTERNAL_LINK.test(href)
  const chipClass =
    'inline-flex items-center gap-1 bg-[#ee671c]/15 text-[#ffb595] hover:bg-[#ee671c]/25 hover:text-[#ffb595] px-1.5 py-0.5 ghost-border text-[12px] font-bold align-baseline no-underline'
  const icon = isInternal ? 'arrow_forward' : 'open_in_new'

  const inner = (
    <>
      <span className="material-symbols-outlined text-[12px] leading-none">{icon}</span>
      <span className="lowercase">{label}</span>
    </>
  )

  if (isInternal) {
    return (
      <Link key={key} href={href} className={chipClass}>
        {inner}
      </Link>
    )
  }
  return (
    <a key={key} href={href} target="_blank" rel="noopener noreferrer" className={chipClass}>
      {inner}
    </a>
  )
}

export default function ForgeKeeper({ userName }: Props) {
  const persisted = typeof window !== 'undefined' ? loadPersisted() : null
  const [open, setOpen] = useState(false)
  const [neutralDino, setNeutralDino] = useState<string>(NEUTRAL_DINOS[0])
  const [messages, setMessages] = useState<Message[]>(
    persisted?.messages ?? [{ role: 'assistant', content: GREETING, emotion: 'neutral' }]
  )
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [emotion, setEmotion] = useState<Emotion>(persisted?.emotion ?? 'neutral')
  const [unread, setUnread] = useState<boolean>(persisted?.unread ?? false)
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const openRef = useRef(open)
  const dinoSrc = dinoForMessage(emotion, neutralDino)

  useEffect(() => {
    openRef.current = open
  }, [open])

  useEffect(() => {
    setNeutralDino(randomNeutral())
  }, [])

  useEffect(() => {
    if (open) setUnread(false)
  }, [open])

  useEffect(() => {
    savePersisted({ messages, unread, emotion })
  }, [messages, unread, emotion])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, loading])

  async function send(e?: React.FormEvent) {
    e?.preventDefault()
    const text = input.trim()
    if (!text || loading) return

    const next = [...messages, { role: 'user' as const, content: text }]
    setMessages(next)
    setInput('')
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/forge_keeper/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': getCsrfToken(),
          Accept: 'application/json',
        },
        body: JSON.stringify({
          message: text,
          history: next.slice(0, -1).filter((m) => m.content !== GREETING),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'the forge keeper is silent.')
      } else {
        const replyEmotion: Emotion =
          data.emotion && ['neutral', 'happy', 'sad', 'angry'].includes(data.emotion) ? data.emotion : 'neutral'
        const updated = [...next, { role: 'assistant' as const, content: data.reply, emotion: replyEmotion }]
        const wasOpen = openRef.current
        if (replyEmotion === 'neutral') setNeutralDino(randomNeutral())
        setMessages(updated)
        setEmotion(replyEmotion)
        if (!wasOpen) setUnread(true)
        savePersisted({ messages: updated, unread: !wasOpen, emotion: replyEmotion })
      }
    } catch {
      setError('the forge keeper turned away. try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="group flex items-center gap-4 cursor-pointer"
        aria-label="Talk to the Forge Keeper"
      >
        <div className="hidden sm:flex flex-col items-end">
          <span className="text-xs uppercase tracking-[0.2em] font-bold text-stone-500 group-hover:text-[#ffb595] transition-colors">
            Forge Keeper
          </span>
          <span className="text-[13px] text-stone-600 group-hover:text-stone-400 transition-colors">
            {open ? 'tap to close' : 'tap to chat'}
          </span>
        </div>
        <div className="relative">
          <img
            key={dinoSrc}
            src={dinoSrc}
            alt="The Forge Keeper"
            className="w-20 h-20 sm:w-24 sm:h-24 object-contain bg-[#1c1b1b] ghost-border p-1.5 group-hover:bg-[#2a2a2a] transition-colors animate-[tour-bounce_400ms_ease-out]"
          />
          {unread && (
            <span
              className="absolute -top-1 -right-1 w-4 h-4 bg-[#ee671c] border-2 border-[#0e0e0e]"
              aria-label="Unread message from the Forge Keeper"
            />
          )}
        </div>
      </button>

      {open && (
        <div className="fixed sm:absolute inset-x-3 bottom-3 sm:inset-auto sm:bottom-auto sm:top-full sm:right-0 sm:mt-3 z-50 w-auto sm:w-[380px] bg-[#1c1b1b] ghost-border shadow-2xl flex flex-col max-h-[70vh] sm:max-h-[520px]">
          <div className="flex items-center justify-between p-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              <img key={dinoSrc} src={dinoSrc} alt="" className="w-7 h-7 object-contain" />
              <div>
                <p className="text-xs font-headline font-bold text-[#e5e2e1] tracking-tight">The Forge Keeper</p>
                <p className="text-[9px] uppercase tracking-[0.2em] font-bold text-stone-500">Mentor · {userName}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="text-stone-500 hover:text-[#ffb595] transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={m.role === 'assistant' ? 'flex gap-2' : 'flex gap-2 flex-row-reverse'}>
                {m.role === 'assistant' && (
                  <img
                    src={dinoForMessage(m.emotion, neutralDino)}
                    alt=""
                    className="w-6 h-6 object-contain shrink-0 mt-0.5"
                  />
                )}
                <div
                  className={`text-[13px] leading-relaxed px-3 py-2 max-w-[85%] whitespace-pre-wrap break-words ${
                    m.role === 'assistant'
                      ? 'bg-[#0e0e0e] ghost-border text-stone-300'
                      : 'bg-[#ee671c]/15 text-[#ffb595] ghost-border'
                  }`}
                >
                  {m.role === 'assistant' ? renderInline(m.content) : m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-2">
                <img src={dinoSrc} alt="" className="w-6 h-6 object-contain shrink-0 mt-0.5" />
                <div className="bg-[#0e0e0e] ghost-border px-3 py-2 text-stone-500 text-[13px] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-stone-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-stone-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-stone-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            {error && (
              <div className="text-[12px] text-red-400 bg-red-500/10 ghost-border px-3 py-2">{error}</div>
            )}
          </div>

          <form onSubmit={send} className="border-t border-white/5 p-2 flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask the Forge Keeper..."
              disabled={loading}
              maxLength={500}
              className="flex-1 bg-[#0e0e0e] ghost-border text-stone-200 text-[13px] px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#ee671c]/30 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="signature-smolder text-[#4c1a00] px-3 py-2 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">send</span>
            </button>
          </form>
        </div>
      )}
    </>
  )
}
