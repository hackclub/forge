import { cloneElement, createContext, isValidElement, useContext, useEffect, useState } from 'react'
import type { ButtonHTMLAttributes, HTMLAttributes, ReactElement, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../lib/cn'
import { Button } from './button'
import type { ButtonProps } from './button'

interface Ctx {
  open: boolean
  setOpen: (v: boolean) => void
}

const AlertDialogCtx = createContext<Ctx | null>(null)

function useDialog() {
  const ctx = useContext(AlertDialogCtx)
  if (!ctx) throw new Error('AlertDialog parts must be used inside <AlertDialog>')
  return ctx
}

export function AlertDialog({ children, open: controlledOpen, onOpenChange }: {
  children: ReactNode
  open?: boolean
  onOpenChange?: (v: boolean) => void
}) {
  const [uncontrolled, setUncontrolled] = useState(false)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen! : uncontrolled
  const setOpen = (v: boolean) => {
    if (!isControlled) setUncontrolled(v)
    onOpenChange?.(v)
  }
  return <AlertDialogCtx.Provider value={{ open, setOpen }}>{children}</AlertDialogCtx.Provider>
}

export function AlertDialogTrigger({ asChild, children }: { asChild?: boolean; children: ReactNode }) {
  const { setOpen } = useDialog()
  if (asChild && isValidElement(children)) {
    const child = children as ReactElement<{ onClick?: (e: React.MouseEvent) => void }>
    return cloneElement(child, {
      onClick: (e: React.MouseEvent) => {
        child.props.onClick?.(e)
        setOpen(true)
      },
    } as Record<string, unknown>)
  }
  return (
    <button type="button" onClick={() => setOpen(true)}>
      {children}
    </button>
  )
}

export function AlertDialogContent({ children, className }: { children: ReactNode; className?: string }) {
  const { open, setOpen } = useDialog()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, setOpen])

  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <div className="admin fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
      <div
        role="alertdialog"
        aria-modal="true"
        className={cn(
          'relative z-10 w-full max-w-lg rounded-lg border border-border bg-background p-6 shadow-lg',
          'flex flex-col gap-4',
          className,
        )}
      >
        {children}
      </div>
    </div>,
    document.body,
  )
}

export function AlertDialogHeader({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('flex flex-col gap-1', className)}>{children}</div>
}

export function AlertDialogTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <h2 className={cn('text-lg font-semibold text-foreground', className)}>{children}</h2>
}

export function AlertDialogDescription({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn('text-sm text-muted-foreground', className)}>{children}</p>
}

export function AlertDialogFooter({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('flex justify-end gap-2 pt-2', className)}>{children}</div>
}

export function AlertDialogCancel(props: ButtonProps & HTMLAttributes<HTMLButtonElement>) {
  const { setOpen } = useDialog()
  const { onClick, variant = 'outline', children = 'Cancel', ...rest } = props
  return (
    <Button
      variant={variant}
      size="sm"
      onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
        ;(onClick as ButtonHTMLAttributes<HTMLButtonElement>['onClick'])?.(e)
        setOpen(false)
      }}
      {...rest}
    >
      {children}
    </Button>
  )
}

export function AlertDialogAction(props: ButtonProps & HTMLAttributes<HTMLButtonElement>) {
  const { setOpen } = useDialog()
  const { onClick, variant = 'default', children, ...rest } = props
  return (
    <Button
      variant={variant}
      size="sm"
      onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
        ;(onClick as ButtonHTMLAttributes<HTMLButtonElement>['onClick'])?.(e)
        setOpen(false)
      }}
      {...rest}
    >
      {children}
    </Button>
  )
}
