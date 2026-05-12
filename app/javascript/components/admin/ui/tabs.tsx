import { createContext, useContext, useState } from 'react'
import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react'
import { cn } from '../lib/cn'

interface Ctx {
  value: string
  setValue: (v: string) => void
}

const Ctx = createContext<Ctx | null>(null)

function useTabs() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('Tabs parts must be used inside <Tabs>')
  return ctx
}

export function Tabs({
  defaultValue,
  value: controlled,
  onValueChange,
  children,
  className,
}: {
  defaultValue?: string
  value?: string
  onValueChange?: (v: string) => void
  children: ReactNode
  className?: string
}) {
  const [uncontrolled, setUncontrolled] = useState(defaultValue ?? '')
  const isControlled = controlled !== undefined
  const value = isControlled ? controlled! : uncontrolled
  const setValue = (v: string) => {
    if (!isControlled) setUncontrolled(v)
    onValueChange?.(v)
  }
  return (
    <Ctx.Provider value={{ value, setValue }}>
      <div className={className}>{children}</div>
    </Ctx.Provider>
  )
}

export function TabsList({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn('inline-flex items-center gap-1 rounded-md bg-muted p-1 text-muted-foreground', className)}
    >
      {children}
    </div>
  )
}

export interface TabsTriggerProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  value: string
}

export function TabsTrigger({ value, className, children, ...rest }: TabsTriggerProps) {
  const { value: active, setValue } = useTabs()
  const isActive = active === value
  return (
    <button
      type="button"
      onClick={() => setValue(value)}
      className={cn(
        'inline-flex items-center justify-center rounded-sm px-3 py-1 text-sm font-medium transition-colors cursor-pointer',
        isActive ? 'bg-background text-foreground shadow-sm' : 'hover:text-foreground',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
}

export interface TabsContentProps extends HTMLAttributes<HTMLDivElement> {
  value: string
}

export function TabsContent({ value, className, children, ...rest }: TabsContentProps) {
  const { value: active } = useTabs()
  if (active !== value) return null
  return (
    <div className={cn('mt-2', className)} {...rest}>
      {children}
    </div>
  )
}
