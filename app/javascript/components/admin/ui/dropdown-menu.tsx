import { cloneElement, createContext, isValidElement, useContext, useEffect, useRef, useState } from 'react'
import type { HTMLAttributes, ReactElement, ReactNode } from 'react'
import { cn } from '../lib/cn'

interface Ctx {
  open: boolean
  setOpen: (v: boolean) => void
  triggerRef: React.RefObject<HTMLElement | null>
}

const Ctx = createContext<Ctx | null>(null)

function useMenu() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('DropdownMenu parts must be used inside <DropdownMenu>')
  return ctx
}

export function DropdownMenu({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLElement | null>(null)
  return <Ctx.Provider value={{ open, setOpen, triggerRef }}>{children}</Ctx.Provider>
}

export function DropdownMenuTrigger({ asChild, children }: { asChild?: boolean; children: ReactNode }) {
  const { setOpen, triggerRef } = useMenu()
  if (asChild && isValidElement(children)) {
    const child = children as ReactElement<{ onClick?: (e: React.MouseEvent) => void; ref?: React.Ref<HTMLElement> }>
    return cloneElement(child, {
      ref: triggerRef,
      onClick: (e: React.MouseEvent) => {
        child.props.onClick?.(e)
        setOpen(true)
      },
    } as Record<string, unknown>)
  }
  return (
    <button
      ref={triggerRef as React.RefObject<HTMLButtonElement>}
      type="button"
      onClick={() => setOpen(true)}
    >
      {children}
    </button>
  )
}

export function DropdownMenuContent({
  children,
  align = 'start',
  className,
}: {
  children: ReactNode
  align?: 'start' | 'end'
  className?: string
}) {
  const { open, setOpen, triggerRef } = useMenu()
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (!ref.current) return
      if (ref.current.contains(e.target as Node)) return
      if (triggerRef.current?.contains(e.target as Node)) return
      setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, setOpen, triggerRef])

  if (!open) return null

  return (
    <div
      ref={ref}
      className={cn(
        'absolute z-50 mt-1 min-w-40 rounded-md border border-border bg-popover text-popover-foreground shadow-md p-1',
        align === 'end' ? 'right-0' : 'left-0',
        className,
      )}
    >
      {children}
    </div>
  )
}

export interface DropdownMenuItemProps extends HTMLAttributes<HTMLButtonElement> {
  destructive?: boolean
}

export function DropdownMenuItem({ destructive, className, onClick, children, ...rest }: DropdownMenuItemProps) {
  const { setOpen } = useMenu()
  return (
    <button
      type="button"
      className={cn(
        'w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded cursor-pointer text-left',
        destructive ? 'text-destructive hover:bg-destructive/10' : 'text-foreground hover:bg-accent',
        className,
      )}
      onClick={(e) => {
        onClick?.(e as React.MouseEvent<HTMLButtonElement>)
        setOpen(false)
      }}
      {...rest}
    >
      {children}
    </button>
  )
}

export function DropdownMenuSeparator({ className }: { className?: string }) {
  return <div className={cn('my-1 h-px bg-border', className)} />
}
